using System.Collections.Concurrent;
using System.Globalization;
using System.Net;
using System.Text;
using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Dtos;
using Sixram.Nextgen.JinmarxWellness.Application.CameraEvents.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Application.Common.Interfaces;
using Sixram.Nextgen.JinmarxWellness.Domain.Entities;
using Sixram.Nextgen.JinmarxWellness.Infrastructure.Persistence;

namespace Sixram.Nextgen.JinmarxWellness.Infrastructure.Services;

public class CameraEventService : ICameraEventService
{
    private const int DefaultCameraEventCooldownSeconds = 60;
    private const string SnapshotSourceName = "hikvision-alarm-server";
    private const string DefaultSnapshotChannel = "101";

    private static readonly string[] SettingsKeys =
    [
        CameraEventSettingKeys.CooldownSeconds,
        CameraEventSettingKeys.SnapshotCaptureEnabled,
        CameraEventSettingKeys.HikvisionCameraIp,
        CameraEventSettingKeys.HikvisionUsername,
        CameraEventSettingKeys.HikvisionPassword,
        CameraEventSettingKeys.HikvisionSnapshotChannel
    ];

    private static readonly ConcurrentDictionary<string, DateTimeOffset> LastAcceptedCooldownEventsUtc = new(
        StringComparer.OrdinalIgnoreCase);

    private readonly ApplicationDbContext _dbContext;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly IHostEnvironment _hostEnvironment;
    private readonly ICameraEventNotifier _cameraEventNotifier;
    private readonly ILogger<CameraEventService> _logger;

    public CameraEventService(
        ApplicationDbContext dbContext,
        IDateTimeProvider dateTimeProvider,
        IHostEnvironment hostEnvironment,
        ICameraEventNotifier cameraEventNotifier,
        ILogger<CameraEventService> logger)
    {
        _dbContext = dbContext;
        _dateTimeProvider = dateTimeProvider;
        _hostEnvironment = hostEnvironment;
        _cameraEventNotifier = cameraEventNotifier;
        _logger = logger;
    }

    private string CameraEventUploadsDir =>
        Path.Combine(_hostEnvironment.ContentRootPath, "uploads", "camera-events");

    public async Task<CameraAlarmResultDto> ReceiveAlarmAsync(
        string rawPayload,
        string? remoteIpAddress,
        CancellationToken cancellationToken = default)
    {
        rawPayload = rawPayload.Trim();
        var alarmXml = ExtractAlarmXml(rawPayload);

        if (string.IsNullOrWhiteSpace(alarmXml))
        {
            throw new ArgumentException("Empty Hikvision alarm payload.", nameof(rawPayload));
        }

        HikvisionAlarmPayload payload;
        try
        {
            payload = ParsePayload(alarmXml);
        }
        catch (Exception ex) when (ex is System.Xml.XmlException or InvalidOperationException)
        {
            throw new ArgumentException("Invalid Hikvision alarm XML.", nameof(rawPayload), ex);
        }

        var cameraIp = FirstNonEmpty(payload.IpAddress, remoteIpAddress);
        var cooldownSeconds = await GetCameraEventCooldownSecondsAsync(cancellationToken);

        if (cooldownSeconds > 0 && IsCooldownEligible(payload))
        {
            var cooldownReservation = TryReserveCooldownSlot(
                cameraIp,
                payload,
                cooldownSeconds,
                _dateTimeProvider.UtcNow);

            if (!cooldownReservation.IsAccepted)
            {
                return new CameraAlarmResultDto
                {
                    Ignored = true,
                    Reason = "Cooldown",
                    CooldownSeconds = cooldownSeconds,
                    LastAcceptedAt = cooldownReservation.LastAcceptedAt
                };
            }
        }

        var cameraEvent = new CameraEvent
        {
            CameraIp = cameraIp,
            Ipv6Address = payload.Ipv6Address,
            PortNo = payload.PortNo,
            Protocol = payload.Protocol,
            MacAddress = payload.MacAddress,
            ChannelId = payload.ChannelId,
            ChannelName = payload.ChannelName,
            EventDateTime = payload.EventDateTime,
            EventType = payload.EventType,
            EventState = payload.EventState,
            EventDescription = payload.EventDescription,
            ActivePostCount = payload.ActivePostCount,
            Source = SnapshotSourceName,
            RawXml = alarmXml,
            CreatedAt = _dateTimeProvider.UtcNow
        };

        if (ShouldCaptureSnapshot(payload))
        {
            await TryCaptureSnapshotAsync(cameraEvent, cancellationToken);
        }

        await _dbContext.CameraEvents.AddAsync(cameraEvent, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(cameraEvent.SnapshotPath))
        {
            cameraEvent.SnapshotUrl = $"/api/camera/hikvision/events/{cameraEvent.Id}/snapshot";
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        await _cameraEventNotifier.NotifyCreatedAsync(ToDto(cameraEvent), cancellationToken);

        return new CameraAlarmResultDto
        {
            Id = cameraEvent.Id,
            CameraIp = cameraEvent.CameraIp,
            EventType = cameraEvent.EventType,
            EventState = cameraEvent.EventState,
            EventDateTime = cameraEvent.EventDateTime,
            SnapshotUrl = cameraEvent.SnapshotUrl
        };
    }

    private static CameraEventDto ToDto(CameraEvent cameraEvent)
    {
        return new CameraEventDto
        {
            Id = cameraEvent.Id,
            CameraIp = cameraEvent.CameraIp,
            ChannelId = cameraEvent.ChannelId,
            ChannelName = cameraEvent.ChannelName,
            EventDateTime = cameraEvent.EventDateTime,
            EventType = cameraEvent.EventType,
            EventState = cameraEvent.EventState,
            EventDescription = cameraEvent.EventDescription,
            ActivePostCount = cameraEvent.ActivePostCount,
            Source = cameraEvent.Source,
            SnapshotUrl = cameraEvent.SnapshotUrl,
            SnapshotCapturedAt = cameraEvent.SnapshotCapturedAt,
            SnapshotError = cameraEvent.SnapshotError,
            CreatedAt = cameraEvent.CreatedAt
        };
    }

    public async Task<IReadOnlyCollection<CameraEventDto>> GetEventsAsync(
        CameraEventQuery query,
        CancellationToken cancellationToken = default)
    {
        var take = Math.Clamp(query.Take, 1, 500);

        return await ApplyCameraEventFilters(_dbContext.CameraEvents.AsNoTracking(), query)
            .OrderByDescending(x => x.SnapshotCapturedAt ?? x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Take(take)
            .Select(x => new CameraEventDto
            {
                Id = x.Id,
                CameraIp = x.CameraIp,
                ChannelId = x.ChannelId,
                ChannelName = x.ChannelName,
                EventDateTime = x.EventDateTime,
                EventType = x.EventType,
                EventState = x.EventState,
                EventDescription = x.EventDescription,
                ActivePostCount = x.ActivePostCount,
                Source = x.Source,
                SnapshotUrl = x.SnapshotUrl,
                SnapshotCapturedAt = x.SnapshotCapturedAt,
                SnapshotError = x.SnapshotError,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CameraEventSummaryDto> GetSummaryAsync(
        CameraEventQuery query,
        CancellationToken cancellationToken = default)
    {
        var hasExplicitFilter =
            !string.IsNullOrWhiteSpace(query.EventType) ||
            !string.IsNullOrWhiteSpace(query.EventState) ||
            query.Start.HasValue ||
            query.End.HasValue ||
            query.CapturedStart.HasValue ||
            query.CapturedEnd.HasValue;

        if (!hasExplicitFilter)
        {
            var now = DateTimeOffset.Now;
            query = new CameraEventQuery
            {
                Start = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, now.Offset),
                End = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, now.Offset).AddDays(1)
            };
        }

        var cameraEvents = ApplyCameraEventFilters(_dbContext.CameraEvents.AsNoTracking(), query);

        var total = await cameraEvents.CountAsync(cancellationToken);
        var active = await cameraEvents.CountAsync(x => x.EventState == "active", cancellationToken);
        var vmdActive = await cameraEvents.CountAsync(
            x => x.EventType == "VMD" && x.EventState == "active",
            cancellationToken);
        var captured = await cameraEvents.CountAsync(
            x => x.SnapshotPath != null && x.SnapshotPath != string.Empty,
            cancellationToken);
        var snapshotFailed = await cameraEvents.CountAsync(
            x => x.SnapshotError != null && x.SnapshotError != string.Empty,
            cancellationToken);
        var lastEvent = await cameraEvents
            .OrderByDescending(x => x.SnapshotCapturedAt ?? x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Select(x => new CameraEventDto
            {
                Id = x.Id,
                CameraIp = x.CameraIp,
                ChannelId = x.ChannelId,
                ChannelName = x.ChannelName,
                EventDateTime = x.EventDateTime,
                EventType = x.EventType,
                EventState = x.EventState,
                EventDescription = x.EventDescription,
                ActivePostCount = x.ActivePostCount,
                Source = x.Source,
                SnapshotUrl = x.SnapshotUrl,
                SnapshotCapturedAt = x.SnapshotCapturedAt,
                SnapshotError = x.SnapshotError,
                CreatedAt = x.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new CameraEventSummaryDto
        {
            TotalToday = total,
            ActiveToday = active,
            VmdActiveToday = vmdActive,
            Total = total,
            Active = active,
            VmdActive = vmdActive,
            Captured = captured,
            SnapshotFailed = snapshotFailed,
            LastEvent = lastEvent
        };
    }

    public async Task<ClearCameraEventsResultDto> ClearEventsAsync(CancellationToken cancellationToken = default)
    {
        var snapshotPaths = await _dbContext.CameraEvents
            .AsNoTracking()
            .Where(x => x.SnapshotPath != null && x.SnapshotPath != string.Empty)
            .Select(x => x.SnapshotPath!)
            .ToListAsync(cancellationToken);

        var deletedCount = await _dbContext.CameraEvents.ExecuteDeleteAsync(cancellationToken);

        foreach (var snapshotPath in snapshotPaths)
        {
            TryDeleteSnapshot(snapshotPath);
        }

        return new ClearCameraEventsResultDto { DeletedCount = deletedCount };
    }

    public async Task<bool> DeleteEventAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var cameraEvent = await _dbContext.CameraEvents
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (cameraEvent is null)
        {
            return false;
        }

        var snapshotPath = cameraEvent.SnapshotPath;
        _dbContext.CameraEvents.Remove(cameraEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(snapshotPath))
        {
            TryDeleteSnapshot(snapshotPath);
        }

        return true;
    }

    public async Task<CameraSnapshotFileDto?> GetSnapshotAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var snapshotPath = await _dbContext.CameraEvents
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => x.SnapshotPath)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(snapshotPath))
        {
            return null;
        }

        var absolutePath = ResolveSnapshotPath(snapshotPath);
        if (absolutePath is null || !File.Exists(absolutePath))
        {
            return null;
        }

        return new CameraSnapshotFileDto
        {
            AbsolutePath = absolutePath,
            ContentType = "image/jpeg"
        };
    }

    public async Task<CameraEventSettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await ReadHikvisionSettingsAsync(cancellationToken);
        return ToSettingsDto(settings);
    }

    public async Task<CameraEventSettingsDto> UpdateSettingsAsync(
        UpdateHikvisionCameraSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var settings = await ReadHikvisionSettingsAsync(cancellationToken);
        ApplyHikvisionSettingsRequest(settings, request);

        await UpsertSettingAsync(
            CameraEventSettingKeys.CooldownSeconds,
            settings.CameraEventCooldownSeconds.ToString(CultureInfo.InvariantCulture),
            "Cooldown window for accepted Hikvision VMD active events.",
            false,
            cancellationToken);
        await UpsertSettingAsync(
            CameraEventSettingKeys.SnapshotCaptureEnabled,
            settings.SnapshotCaptureEnabled.ToString(CultureInfo.InvariantCulture),
            "Whether accepted camera events should capture a Hikvision snapshot.",
            false,
            cancellationToken);
        await UpsertSettingAsync(
            CameraEventSettingKeys.HikvisionCameraIp,
            settings.CameraIp,
            "Hikvision camera IP address used for snapshots.",
            false,
            cancellationToken);
        await UpsertSettingAsync(
            CameraEventSettingKeys.HikvisionUsername,
            settings.Username,
            "Hikvision camera username used for snapshots.",
            false,
            cancellationToken);
        await UpsertSettingAsync(
            CameraEventSettingKeys.HikvisionSnapshotChannel,
            settings.SnapshotChannel,
            "Hikvision streaming channel used for snapshots.",
            false,
            cancellationToken);

        if (!string.IsNullOrEmpty(request.Password))
        {
            await UpsertSettingAsync(
                CameraEventSettingKeys.HikvisionPassword,
                settings.Password,
                "Hikvision camera password used for snapshots.",
                false,
                cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToSettingsDto(settings);
    }

    public async Task<CameraSnapshotTestResultDto> TestSnapshotAsync(
        UpdateHikvisionCameraSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        var settings = await ReadHikvisionSettingsAsync(cancellationToken);
        ApplyHikvisionSettingsRequest(settings, request);

        var bytes = await FetchSnapshotBytesAsync(settings, null, cancellationToken);

        return new CameraSnapshotTestResultDto
        {
            CapturedAt = _dateTimeProvider.UtcNow,
            ImageDataUrl = $"data:image/jpeg;base64,{Convert.ToBase64String(bytes)}"
        };
    }

    private static IQueryable<CameraEvent> ApplyCameraEventFilters(
        IQueryable<CameraEvent> query,
        CameraEventQuery filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.EventType))
        {
            var eventType = filter.EventType.Trim();
            query = query.Where(x => x.EventType == eventType);
        }

        if (!string.IsNullOrWhiteSpace(filter.EventState))
        {
            var eventState = filter.EventState.Trim();
            query = query.Where(x => x.EventState == eventState);
        }

        if (filter.Start.HasValue)
        {
            query = query.Where(x => x.EventDateTime >= filter.Start.Value);
        }

        if (filter.End.HasValue)
        {
            query = query.Where(x => x.EventDateTime < filter.End.Value);
        }

        if (filter.CapturedStart.HasValue)
        {
            query = query.Where(
                x => x.SnapshotCapturedAt != null && x.SnapshotCapturedAt >= filter.CapturedStart.Value);
        }

        if (filter.CapturedEnd.HasValue)
        {
            query = query.Where(
                x => x.SnapshotCapturedAt != null && x.SnapshotCapturedAt < filter.CapturedEnd.Value);
        }

        return query;
    }

    private async Task<int> GetCameraEventCooldownSecondsAsync(CancellationToken cancellationToken)
    {
        var value = await _dbContext.SystemSettings
            .AsNoTracking()
            .Where(x => x.Key == CameraEventSettingKeys.CooldownSeconds)
            .Select(x => x.Value)
            .FirstOrDefaultAsync(cancellationToken);

        return ParseCooldownSeconds(value);
    }

    private async Task<HikvisionCameraSettings> ReadHikvisionSettingsAsync(CancellationToken cancellationToken)
    {
        var values = await _dbContext.SystemSettings
            .AsNoTracking()
            .Where(x => SettingsKeys.Contains(x.Key))
            .ToDictionaryAsync(
                x => x.Key,
                x => x.Value,
                StringComparer.OrdinalIgnoreCase,
                cancellationToken);

        return new HikvisionCameraSettings
        {
            CameraEventCooldownSeconds = ParseCooldownSeconds(
                values.GetValueOrDefault(CameraEventSettingKeys.CooldownSeconds)),
            SnapshotCaptureEnabled = ParseBoolean(
                values.GetValueOrDefault(CameraEventSettingKeys.SnapshotCaptureEnabled)),
            CameraIp = NormalizeOptional(values.GetValueOrDefault(CameraEventSettingKeys.HikvisionCameraIp)),
            Username = NormalizeOptional(values.GetValueOrDefault(CameraEventSettingKeys.HikvisionUsername)) ?? "admin",
            Password = NormalizeOptional(values.GetValueOrDefault(CameraEventSettingKeys.HikvisionPassword)),
            SnapshotChannel = NormalizeOptional(values.GetValueOrDefault(CameraEventSettingKeys.HikvisionSnapshotChannel))
                ?? DefaultSnapshotChannel
        };
    }

    private async Task UpsertSettingAsync(
        string key,
        string? value,
        string description,
        bool isEncrypted,
        CancellationToken cancellationToken)
    {
        var setting = await _dbContext.SystemSettings.FirstOrDefaultAsync(
            x => x.Key == key,
            cancellationToken);

        if (setting is null)
        {
            _dbContext.SystemSettings.Add(new SystemSetting
            {
                Key = key,
                Value = value,
                Group = CameraEventSettingKeys.Group,
                Description = description,
                IsEncrypted = isEncrypted,
                CreatedAt = _dateTimeProvider.UtcNow
            });

            return;
        }

        setting.Value = value;
        setting.Group = CameraEventSettingKeys.Group;
        setting.Description = description;
        setting.IsEncrypted = isEncrypted;
        setting.LastModifiedAt = _dateTimeProvider.UtcNow;
    }

    private async Task TryCaptureSnapshotAsync(CameraEvent cameraEvent, CancellationToken cancellationToken)
    {
        var settings = await ReadHikvisionSettingsAsync(cancellationToken);
        if (!settings.SnapshotCaptureEnabled)
        {
            return;
        }

        var cameraIp = FirstNonEmpty(settings.CameraIp, cameraEvent.CameraIp);
        if (string.IsNullOrWhiteSpace(cameraIp)
            || string.IsNullOrWhiteSpace(settings.Username)
            || string.IsNullOrWhiteSpace(settings.Password))
        {
            cameraEvent.SnapshotError = "Snapshot settings are incomplete.";
            return;
        }

        try
        {
            var bytes = await FetchSnapshotBytesAsync(settings, cameraIp, cancellationToken);

            var eventDate = cameraEvent.EventDateTime;
            var relativeDir = Path.Combine(
                "uploads",
                "camera-events",
                eventDate.Year.ToString("0000", CultureInfo.InvariantCulture),
                eventDate.Month.ToString("00", CultureInfo.InvariantCulture));
            var absoluteDir = Path.Combine(
                CameraEventUploadsDir,
                eventDate.Year.ToString("0000", CultureInfo.InvariantCulture),
                eventDate.Month.ToString("00", CultureInfo.InvariantCulture));

            Directory.CreateDirectory(absoluteDir);

            var fileName = cameraEvent.Id > 0
                ? $"event-{cameraEvent.Id}.jpg"
                : $"event-{_dateTimeProvider.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}.jpg";
            var absolutePath = Path.Combine(absoluteDir, fileName);
            await File.WriteAllBytesAsync(absolutePath, bytes, cancellationToken);

            cameraEvent.SnapshotPath = Path.Combine(relativeDir, fileName).Replace('\\', '/');
            cameraEvent.SnapshotCapturedAt = _dateTimeProvider.UtcNow;
            cameraEvent.SnapshotError = null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to capture Hikvision snapshot for a camera event.");
            cameraEvent.SnapshotError = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message;
        }
    }

    private async Task<byte[]> FetchSnapshotBytesAsync(
        HikvisionCameraSettings settings,
        string? fallbackCameraIp,
        CancellationToken cancellationToken)
    {
        var cameraIp = FirstNonEmpty(settings.CameraIp, fallbackCameraIp);
        if (string.IsNullOrWhiteSpace(cameraIp)
            || string.IsNullOrWhiteSpace(settings.Username)
            || string.IsNullOrWhiteSpace(settings.Password))
        {
            throw new InvalidOperationException("Snapshot settings are incomplete.");
        }

        var channel = string.IsNullOrWhiteSpace(settings.SnapshotChannel)
            ? DefaultSnapshotChannel
            : settings.SnapshotChannel.Trim();
        var snapshotUri = new Uri(
            $"http://{cameraIp}/ISAPI/Streaming/channels/{Uri.EscapeDataString(channel)}/picture");

        using var handler = new HttpClientHandler
        {
            Credentials = new NetworkCredential(settings.Username, settings.Password),
            PreAuthenticate = false
        };
        using var httpClient = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
        using var response = await httpClient.GetAsync(snapshotUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        if (!LooksLikeJpeg(bytes))
        {
            throw new InvalidOperationException("Camera snapshot response was not a JPEG image.");
        }

        return bytes;
    }

    private static bool LooksLikeJpeg(byte[] bytes)
        => bytes.Length > 4 && bytes[0] == 0xFF && bytes[1] == 0xD8;

    private static string? ExtractAlarmXml(string rawPayload)
    {
        if (string.IsNullOrWhiteSpace(rawPayload))
        {
            return null;
        }

        rawPayload = rawPayload.Replace("\0", string.Empty);
        var rootStartIndex = rawPayload.IndexOf("<EventNotificationAlert", StringComparison.OrdinalIgnoreCase);
        if (rootStartIndex < 0)
        {
            return null;
        }

        const string closingTag = "</EventNotificationAlert>";
        var endIndex = rawPayload.IndexOf(closingTag, rootStartIndex, StringComparison.OrdinalIgnoreCase);
        if (endIndex < 0)
        {
            return null;
        }

        endIndex += closingTag.Length;
        return rawPayload[rootStartIndex..endIndex].Trim();
    }

    private static HikvisionAlarmPayload ParsePayload(string rawXml)
    {
        var doc = XDocument.Parse(rawXml);
        var root = doc.Root ?? throw new InvalidOperationException("Missing root element.");

        var eventDateTime = ParseDateTimeOffset(Value(root, "dateTime"));
        var eventType = Value(root, "eventType") ?? string.Empty;
        var eventState = Value(root, "eventState") ?? string.Empty;

        return new HikvisionAlarmPayload(
            IpAddress: Value(root, "ipAddress"),
            Ipv6Address: Value(root, "ipv6Address"),
            PortNo: ParseInt(Value(root, "portNo")),
            Protocol: Value(root, "protocol"),
            MacAddress: Value(root, "macAddress"),
            ChannelId: ParseInt(Value(root, "channelID")),
            ChannelName: Value(root, "channelName"),
            EventDateTime: eventDateTime,
            EventType: eventType.Trim(),
            EventState: eventState.Trim(),
            EventDescription: Value(root, "eventDescription"),
            ActivePostCount: ParseInt(Value(root, "activePostCount")));
    }

    private static string? Value(XElement root, string localName)
        => root.Descendants()
            .FirstOrDefault(x => string.Equals(x.Name.LocalName, localName, StringComparison.OrdinalIgnoreCase))
            ?.Value
            .Trim();

    private static int? ParseInt(string? value)
        => int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : null;

    private static DateTimeOffset ParseDateTimeOffset(string? value)
        => DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var parsed)
            ? parsed
            : DateTimeOffset.Now;

    private static int ParseCooldownSeconds(string? value)
        => int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
            ? Math.Clamp(parsed, 0, 3600)
            : DefaultCameraEventCooldownSeconds;

    private static bool ParseBoolean(string? value)
    {
        if (bool.TryParse(value, out var parsed))
        {
            return parsed;
        }

        return string.Equals(value, "1", StringComparison.Ordinal);
    }

    private static string? NormalizeOptional(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? FirstNonEmpty(params string?[] values)
        => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();

    private static bool IsCooldownEligible(HikvisionAlarmPayload payload)
        => string.Equals(payload.EventType, "VMD", StringComparison.OrdinalIgnoreCase)
           && string.Equals(payload.EventState, "active", StringComparison.OrdinalIgnoreCase);

    private static bool ShouldCaptureSnapshot(HikvisionAlarmPayload payload)
        => string.Equals(payload.EventType, "VMD", StringComparison.OrdinalIgnoreCase)
           && string.Equals(payload.EventState, "active", StringComparison.OrdinalIgnoreCase);

    private static CooldownReservation TryReserveCooldownSlot(
        string? cameraIp,
        HikvisionAlarmPayload payload,
        int cooldownSeconds,
        DateTimeOffset nowUtc)
    {
        var cooldownThreshold = nowUtc.AddSeconds(-cooldownSeconds);
        var key = string.Join(
            '|',
            string.IsNullOrWhiteSpace(cameraIp) ? "unknown" : cameraIp.Trim(),
            payload.EventType,
            payload.EventState);

        while (true)
        {
            if (LastAcceptedCooldownEventsUtc.TryGetValue(key, out var lastAcceptedAt))
            {
                if (lastAcceptedAt >= cooldownThreshold)
                {
                    return new CooldownReservation(false, lastAcceptedAt);
                }

                if (LastAcceptedCooldownEventsUtc.TryUpdate(key, nowUtc, lastAcceptedAt))
                {
                    return new CooldownReservation(true, nowUtc);
                }

                continue;
            }

            if (LastAcceptedCooldownEventsUtc.TryAdd(key, nowUtc))
            {
                return new CooldownReservation(true, nowUtc);
            }
        }
    }

    private static void ApplyHikvisionSettingsRequest(
        HikvisionCameraSettings settings,
        UpdateHikvisionCameraSettingsRequest request)
    {
        if (request.CameraEventCooldownSeconds.HasValue)
        {
            settings.CameraEventCooldownSeconds = Math.Clamp(request.CameraEventCooldownSeconds.Value, 0, 3600);
        }

        if (request.SnapshotCaptureEnabled.HasValue)
        {
            settings.SnapshotCaptureEnabled = request.SnapshotCaptureEnabled.Value;
        }

        if (request.CameraIp is not null)
        {
            settings.CameraIp = NormalizeOptional(request.CameraIp);
        }

        if (request.Username is not null)
        {
            settings.Username = NormalizeOptional(request.Username);
        }

        if (request.SnapshotChannel is not null)
        {
            settings.SnapshotChannel = NormalizeOptional(request.SnapshotChannel) ?? DefaultSnapshotChannel;
        }

        if (!string.IsNullOrEmpty(request.Password))
        {
            settings.Password = request.Password;
        }
    }

    private static CameraEventSettingsDto ToSettingsDto(HikvisionCameraSettings settings)
        => new()
        {
            CameraEventCooldownSeconds = settings.CameraEventCooldownSeconds,
            SnapshotCaptureEnabled = settings.SnapshotCaptureEnabled,
            CameraIp = settings.CameraIp ?? string.Empty,
            Username = settings.Username ?? string.Empty,
            SnapshotChannel = string.IsNullOrWhiteSpace(settings.SnapshotChannel)
                ? DefaultSnapshotChannel
                : settings.SnapshotChannel,
            PasswordConfigured = !string.IsNullOrWhiteSpace(settings.Password)
        };

    private string? ResolveSnapshotPath(string snapshotPath)
    {
        var normalized = snapshotPath
            .Replace('/', Path.DirectorySeparatorChar)
            .Replace('\\', Path.DirectorySeparatorChar);
        var absolutePath = Path.GetFullPath(Path.Combine(_hostEnvironment.ContentRootPath, normalized));
        var expectedRoot = Path.GetFullPath(CameraEventUploadsDir);
        var expectedRootWithSeparator = expectedRoot.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        return absolutePath.StartsWith(expectedRootWithSeparator, StringComparison.OrdinalIgnoreCase)
            ? absolutePath
            : null;
    }

    private void TryDeleteSnapshot(string snapshotPath)
    {
        try
        {
            var absolutePath = ResolveSnapshotPath(snapshotPath);
            if (absolutePath is not null && File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete camera event snapshot {SnapshotPath}", snapshotPath);
        }
    }

    private sealed record HikvisionAlarmPayload(
        string? IpAddress,
        string? Ipv6Address,
        int? PortNo,
        string? Protocol,
        string? MacAddress,
        int? ChannelId,
        string? ChannelName,
        DateTimeOffset EventDateTime,
        string EventType,
        string EventState,
        string? EventDescription,
        int? ActivePostCount);

    private sealed record CooldownReservation(bool IsAccepted, DateTimeOffset LastAcceptedAt);

    private sealed class HikvisionCameraSettings
    {
        public int CameraEventCooldownSeconds { get; set; } = DefaultCameraEventCooldownSeconds;
        public bool SnapshotCaptureEnabled { get; set; }
        public string? CameraIp { get; set; }
        public string? Username { get; set; } = "admin";
        public string? Password { get; set; }
        public string? SnapshotChannel { get; set; } = DefaultSnapshotChannel;
    }
}
