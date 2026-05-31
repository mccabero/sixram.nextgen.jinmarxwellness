/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useAuth } from "@/hooks/useAuth";
import { cn, getErrorMessage } from "@/lib/utils";
import {
  cameraEventService,
  normalizeCameraEvent,
} from "@/services/cameraEventService";
import {
  canReachCameraEventHub,
  createCameraEventHubConnection,
  HubConnectionState,
} from "@/services/cameraEventRealtimeService";
import type {
  CameraEventQuery,
  CameraEventRow,
  CameraEventSettings,
  CameraEventSummary,
  UpdateHikvisionCameraSettingsRequest,
} from "@/types/cameraEvent";

type SettingsForm = CameraEventSettings & {
  password: string;
};

type BrowserNotificationState = NotificationPermission | "unsupported";
type RealtimeStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "polling"
  | "disconnected";

const emptySettingsForm: SettingsForm = {
  cameraEventCooldownSeconds: 60,
  snapshotCaptureEnabled: false,
  cameraIp: "",
  username: "admin",
  snapshotChannel: "101",
  passwordConfigured: false,
  password: "",
};

const timezonePattern = /(z|[+-]\d{2}:?\d{2})$/i;

function todayInputValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function captureDateRange(value: string) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatDateTime(
  value?: string | null,
  options?: { assumeUtcWhenTimezoneMissing?: boolean },
) {
  if (!value) {
    return "-";
  }

  const trimmed = value.trim();
  const normalized =
    options?.assumeUtcWhenTimezoneMissing &&
    trimmed &&
    !timezonePattern.test(trimmed)
      ? `${trimmed}Z`
      : trimmed;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCapturedDateTime(row?: CameraEventRow | null) {
  if (!row) {
    return "-";
  }

  if (row.snapshotCapturedAt) {
    return formatDateTime(row.snapshotCapturedAt, {
      assumeUtcWhenTimezoneMissing: true,
    });
  }

  return formatDateTime(row.eventDateTime);
}

function formatCaptureDateLabel(value: string) {
  if (!value) {
    return "All capture dates";
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function isCountedEntry(row: CameraEventRow) {
  return (
    row.eventType.toUpperCase() === "VMD" &&
    row.eventState.toLowerCase() === "active"
  );
}

function decrementCount(value: number) {
  return Math.max(0, value - 1);
}

function clampCooldownSeconds(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 60;
  }

  return Math.max(0, Math.min(3600, Math.trunc(parsed)));
}

function toSettingsForm(settings: CameraEventSettings): SettingsForm {
  return {
    ...settings,
    cameraEventCooldownSeconds: clampCooldownSeconds(
      settings.cameraEventCooldownSeconds,
    ),
    username: settings.username || "admin",
    snapshotChannel: settings.snapshotChannel || "101",
    password: "",
  };
}

function buildSettingsPayload(
  form: SettingsForm,
): UpdateHikvisionCameraSettingsRequest {
  const payload: UpdateHikvisionCameraSettingsRequest = {
    cameraEventCooldownSeconds: clampCooldownSeconds(
      form.cameraEventCooldownSeconds,
    ),
    snapshotCaptureEnabled: form.snapshotCaptureEnabled,
    cameraIp: form.cameraIp.trim(),
    username: form.username.trim(),
    snapshotChannel: form.snapshotChannel.trim() || "101",
  };

  if (form.password.trim()) {
    payload.password = form.password;
  }

  return payload;
}

function buildCameraEventQuery(captureDate: string): CameraEventQuery {
  const range = captureDateRange(captureDate);

  return {
    take: 200,
    eventType: "VMD",
    eventState: "active",
    capturedStart: range?.start,
    capturedEnd: range?.end,
  };
}

function getBrowserNotificationState(): BrowserNotificationState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
}

function getCameraLabel(row: CameraEventRow) {
  if (row.channelName?.trim()) {
    return row.channelName.trim();
  }

  if (row.channelId) {
    return `Channel ${row.channelId}`;
  }

  if (row.cameraIp?.trim()) {
    return `Camera ${row.cameraIp.trim()}`;
  }

  return "Camera";
}

function isVisibleForCurrentFilters(row: CameraEventRow, captureDate: string) {
  if (!isCountedEntry(row)) {
    return false;
  }

  if (!captureDate) {
    return true;
  }

  const range = captureDateRange(captureDate);
  const capturedAt = row.snapshotCapturedAt ?? row.eventDateTime ?? row.createdAt;

  if (!range || !capturedAt) {
    return false;
  }

  const capturedTime = new Date(capturedAt).getTime();
  return (
    capturedTime >= new Date(range.start).getTime() &&
    capturedTime < new Date(range.end).getTime()
  );
}

function showCameraEventNotification(row: CameraEventRow) {
  if (getBrowserNotificationState() !== "granted") {
    return;
  }

  const snapshotUrl = row.snapshotUrl
    ? new URL(row.snapshotUrl, window.location.origin).toString()
    : null;
  const notificationOptions: NotificationOptions & { image?: string } = {
    body: `${getCameraLabel(row)} captured movement.`,
    icon: "/images/jinmarx-logo.png",
    requireInteraction: true,
    silent: false,
    tag: `camera-event-${row.id}`,
  };

  if (snapshotUrl) {
    notificationOptions.image = snapshotUrl;
  }

  const notification = new Notification("Motion detected", notificationOptions);

  notification.onclick = () => {
    window.focus();
    window.location.assign("/administration/camera-events");
    notification.close();
  };
}

function getRealtimeStatusLabel(status: RealtimeStatus) {
  switch (status) {
    case "connected":
      return "Live";
    case "polling":
      return "Polling";
    case "connecting":
      return "Connecting";
    case "reconnecting":
      return "Reconnecting";
    default:
      return "Offline";
  }
}

function getNotificationStatusLabel(state: BrowserNotificationState) {
  switch (state) {
    case "granted":
      return "Notifications on";
    case "denied":
      return "Notifications blocked";
    case "unsupported":
      return "Notifications unavailable";
    default:
      return "Enable notifications";
  }
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Camera;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-white/60 p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl",
            tone === "success" && "bg-emerald-50 text-emerald-700",
            tone === "warning" && "bg-rose-50 text-rose-700",
            tone === "default" && "bg-[var(--color-black)] text-[var(--color-gold)]",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CameraEventsPageClient() {
  const { permissions, roles } = useAuth();
  const isAdmin = roles.includes("Admin");
  const canView = isAdmin || permissions.includes("camera_events.view");
  const canManage = isAdmin || permissions.includes("camera_events.manage");
  const [rows, setRows] = useState<CameraEventRow[]>([]);
  const [summary, setSummary] = useState<CameraEventSummary | null>(null);
  const [settingsForm, setSettingsForm] =
    useState<SettingsForm>(emptySettingsForm);
  const [captureDate, setCaptureDate] = useState(todayInputValue());
  const [testSnapshotUrl, setTestSnapshotUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notificationState, setNotificationState] =
    useState<BrowserNotificationState>("default");
  const notificationStateRef =
    useRef<BrowserNotificationState>(notificationState);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("disconnected");
  const [newEventIds, setNewEventIds] = useState<Set<number>>(() => new Set());
  const seenEventIdsRef = useRef<Set<number>>(new Set());
  const newEventTimersRef = useRef<number[]>([]);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const params = buildCameraEventQuery(captureDate);
      const [summaryResponse, eventsResponse, settingsResponse] =
        await Promise.all([
          cameraEventService.getSummary(params),
          cameraEventService.getEvents(params),
          cameraEventService.getSettings(),
        ]);

      setSummary(summaryResponse);
      setRows(eventsResponse);
      seenEventIdsRef.current = new Set(
        eventsResponse.map((event) => event.id),
      );
      setSettingsForm((current) => ({
        ...toSettingsForm(settingsResponse),
        password: current.password,
      }));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Unable to load camera events."));
    } finally {
      setIsLoading(false);
    }
  }, [captureDate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setNotificationState(getBrowserNotificationState());
  }, []);

  useEffect(() => {
    notificationStateRef.current = notificationState;
  }, [notificationState]);

  const refreshSummary = useCallback(async () => {
    const summaryResponse = await cameraEventService.getSummary(
      buildCameraEventQuery(captureDate),
    );
    setSummary(summaryResponse);
  }, [captureDate]);

  const markNewEvent = useCallback((id: number) => {
    setNewEventIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    const timer = window.setTimeout(() => {
      setNewEventIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 12000);

    newEventTimersRef.current.push(timer);
  }, []);

  const handleIncomingEvent = useCallback(
    (payload: CameraEventRow) => {
      const nextEvent = normalizeCameraEvent(payload);
      const wasSeen = seenEventIdsRef.current.has(nextEvent.id);
      seenEventIdsRef.current.add(nextEvent.id);

      if (!isVisibleForCurrentFilters(nextEvent, captureDate) || wasSeen) {
        return false;
      }

      setRows((current) => {
        if (current.some((row) => row.id === nextEvent.id)) {
          return current;
        }

        return [nextEvent, ...current].slice(0, 200);
      });
      markNewEvent(nextEvent.id);

      if (notificationStateRef.current === "granted") {
        showCameraEventNotification(nextEvent);
      }

      return true;
    },
    [captureDate, markNewEvent],
  );

  useEffect(() => {
    const timers = newEventTimersRef.current;

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (!canView) {
      setRealtimeStatus("disconnected");
      return;
    }

    let isDisposed = false;
    let connection: ReturnType<typeof createCameraEventHubConnection> | null =
      null;
    let pollingTimer: number | null = null;

    function clearPollingTimer() {
      if (pollingTimer !== null) {
        window.clearTimeout(pollingTimer);
        pollingTimer = null;
      }
    }

    function startPollingFallback() {
      if (isDisposed || pollingTimer !== null) {
        return;
      }

      setRealtimeStatus("polling");

      const poll = async () => {
        if (isDisposed) {
          return;
        }

        try {
          const events = await cameraEventService.getEvents(
            buildCameraEventQuery(captureDate),
          );
          let hasNewEvent = false;

          for (const event of [...events].reverse()) {
            hasNewEvent = handleIncomingEvent(event) || hasNewEvent;
          }

          if (hasNewEvent) {
            void refreshSummary();
          }
        } catch {
          if (!isDisposed) {
            setRealtimeStatus("disconnected");
          }
        } finally {
          if (!isDisposed) {
            pollingTimer = window.setTimeout(poll, 10000);
          }
        }
      };

      pollingTimer = window.setTimeout(poll, 3000);
    }

    async function startConnection() {
      try {
        setRealtimeStatus("connecting");

        const hubIsAvailable = await canReachCameraEventHub();
        if (!hubIsAvailable || isDisposed) {
          startPollingFallback();
          return;
        }

        connection = createCameraEventHubConnection();

        connection.on("CameraEventCreated", (payload: CameraEventRow) => {
          if (handleIncomingEvent(payload)) {
            void refreshSummary();
          }
        });

        connection.onreconnecting(() => {
          if (!isDisposed) {
            setRealtimeStatus("reconnecting");
          }
        });

        connection.onreconnected(() => {
          if (!isDisposed) {
            setRealtimeStatus("connected");
            void load();
          }
        });

        connection.onclose(() => {
          if (!isDisposed) {
            startPollingFallback();
          }
        });

        const activeConnection = connection;
        await activeConnection.start();

        if (
          !isDisposed &&
          activeConnection.state === HubConnectionState.Connected
        ) {
          setRealtimeStatus("connected");
        }
      } catch {
        if (!isDisposed) {
          startPollingFallback();
        }
      }
    }

    void startConnection();

    return () => {
      isDisposed = true;
      clearPollingTimer();

      if (connection) {
        connection.off("CameraEventCreated");

        if (connection.state !== HubConnectionState.Disconnected) {
          void connection.stop();
        }
      }
    };
  }, [canView, captureDate, handleIncomingEvent, load, refreshSummary]);

  const countedEntries =
    summary?.vmdActive ?? rows.filter((row) => isCountedEntry(row)).length;
  const capturedImages =
    summary?.captured ?? rows.filter((row) => row.snapshotUrl).length;
  const snapshotIssues =
    summary?.snapshotFailed ?? rows.filter((row) => row.snapshotError).length;
  const captureRate =
    countedEntries > 0
      ? Math.round((capturedImages / countedEntries) * 100)
      : 0;
  const busy = isLoading || isSaving || isTesting || isClearing || deletingId !== null;

  const tableRows = useMemo(() => rows, [rows]);
  const isRealtimeHealthy =
    realtimeStatus === "connected" || realtimeStatus === "polling";

  async function handleSaveSettings() {
    if (!canManage) {
      setError("You do not have permission to update camera settings.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const settings = await cameraEventService.updateSettings(
        buildSettingsPayload(settingsForm),
      );
      setSettingsForm(toSettingsForm(settings));
      setSuccessMessage("Camera settings were saved.");
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Unable to save camera settings."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestSnapshot() {
    if (!canManage) {
      setError("You do not have permission to test camera settings.");
      return;
    }

    try {
      setIsTesting(true);
      setError(null);
      setSuccessMessage(null);

      const result = await cameraEventService.testSnapshot(
        buildSettingsPayload(settingsForm),
      );
      setTestSnapshotUrl(result.imageDataUrl);
      setSuccessMessage("Snapshot test captured.");
    } catch (testError) {
      setError(getErrorMessage(testError, "Unable to test camera snapshot."));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleClearAll() {
    if (!canManage) {
      setError("You do not have permission to clear camera events.");
      return;
    }

    if (!window.confirm("Clear all camera events?")) {
      return;
    }

    try {
      setIsClearing(true);
      setError(null);
      setSuccessMessage(null);

      const result = await cameraEventService.clearEvents();
      setSuccessMessage(
        `Cleared ${result.deletedCount} camera event${result.deletedCount === 1 ? "" : "s"}.`,
      );
      await load();
    } catch (clearError) {
      setError(getErrorMessage(clearError, "Unable to clear camera events."));
    } finally {
      setIsClearing(false);
    }
  }

  async function handleDeleteCapture(row: CameraEventRow) {
    if (!canManage) {
      setError("You do not have permission to delete camera events.");
      return;
    }

    if (deletingId !== null) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this accepted capture? Use this when the detected person is a therapist or staff member. The event and saved snapshot will be removed.",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(row.id);
      setError(null);
      setSuccessMessage(null);

      await cameraEventService.deleteEvent(row.id);

      setRows((current) => current.filter((item) => item.id !== row.id));
      setNewEventIds((current) => {
        if (!current.has(row.id)) {
          return current;
        }

        const next = new Set(current);
        next.delete(row.id);
        return next;
      });
      setSummary((current) => {
        if (!current) {
          return current;
        }

        const isActive = row.eventState.toLowerCase() === "active";
        const isVmdActive = isCountedEntry(row);
        const hasSnapshot = Boolean(row.snapshotUrl);
        const hasSnapshotIssue = Boolean(row.snapshotError);

        return {
          ...current,
          totalToday: decrementCount(current.totalToday),
          activeToday: isActive
            ? decrementCount(current.activeToday)
            : current.activeToday,
          vmdActiveToday: isVmdActive
            ? decrementCount(current.vmdActiveToday)
            : current.vmdActiveToday,
          total: decrementCount(current.total),
          active: isActive ? decrementCount(current.active) : current.active,
          vmdActive: isVmdActive
            ? decrementCount(current.vmdActive)
            : current.vmdActive,
          captured: hasSnapshot
            ? decrementCount(current.captured)
            : current.captured,
          snapshotFailed: hasSnapshotIssue
            ? decrementCount(current.snapshotFailed)
            : current.snapshotFailed,
          lastEvent:
            current.lastEvent?.id === row.id ? null : current.lastEvent,
        };
      });
      setSuccessMessage("Accepted capture was deleted.");
      void refreshSummary().catch(() => undefined);
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, "Unable to delete accepted capture."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEnableNotifications() {
    setError(null);
    setSuccessMessage(null);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationState("unsupported");
      setError("This browser does not support desktop notifications.");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationState(permission);

    if (permission === "granted") {
      setSuccessMessage("Camera event notifications are enabled.");
      setError(null);
      return;
    }

    if (permission === "denied") {
      setError("Notifications are blocked in this browser.");
    }
  }

  function handleTestNotification() {
    setError(null);
    setSuccessMessage(null);

    if (getBrowserNotificationState() !== "granted") {
      setNotificationState(getBrowserNotificationState());
      setError("Enable browser notifications before sending a test alert.");
      return;
    }

    const notification = new Notification("Motion detected", {
      body: "Test alert from Camera Events.",
      icon: "/images/jinmarx-logo.png",
      requireInteraction: true,
      silent: false,
      tag: `camera-event-test-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setSuccessMessage("Test notification was sent.");
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--color-ink)]">
            Camera Events
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Hikvision VMD captures, snapshot status, and camera connection
            settings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold",
              isRealtimeHealthy
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-black/10 bg-white/65 text-[var(--color-muted)]",
            )}
          >
            {isRealtimeHealthy ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {getRealtimeStatusLabel(realtimeStatus)}
          </div>

          {notificationState === "default" ? (
            <Button
              variant="outline"
              onClick={() => void handleEnableNotifications()}
              disabled={busy}
            >
              <Bell className="h-4 w-4" />
              Enable notifications
            </Button>
          ) : (
            <>
              <div
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold",
                  notificationState === "granted"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700",
                )}
              >
                {notificationState === "granted" ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                {getNotificationStatusLabel(notificationState)}
              </div>

              {notificationState === "granted" ? (
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={busy}
                >
                  <Bell className="h-4 w-4" />
                  Test notification
                </Button>
              ) : null}
            </>
          )}

          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={busy}
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatTile
          icon={Car}
          label="Entries"
          value={countedEntries.toLocaleString()}
          tone="success"
        />
        <StatTile
          icon={ImageIcon}
          label="Images"
          value={capturedImages.toLocaleString()}
        />
        <StatTile
          icon={CheckCircle2}
          label="Capture Rate"
          value={`${captureRate}%`}
        />
        <StatTile
          icon={AlertTriangle}
          label="Issues"
          value={snapshotIssues.toLocaleString()}
          tone={snapshotIssues > 0 ? "warning" : "default"}
        />
      </div>

      <div className="space-y-6">
        <div className="panel overflow-hidden rounded-[28px] border border-black/8">
          <div className="flex flex-col gap-4 border-b border-black/6 bg-white/55 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Accepted captures
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  Last capture: {formatCapturedDateTime(summary?.lastEvent)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Input
                type="date"
                label="Capture date"
                value={captureDate}
                onChange={(event) => setCaptureDate(event.target.value)}
                disabled={busy}
                icon={<Calendar className="h-4 w-4" />}
                className="sm:w-48"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCaptureDate(todayInputValue())}
                  disabled={busy}
                  className="shrink-0"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCaptureDate("")}
                  disabled={busy}
                  className="shrink-0"
                  aria-label="Show all capture dates"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-b border-black/6 bg-white/35 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {formatCaptureDateLabel(captureDate)}
          </div>

          {isLoading ? (
            <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
              Loading camera events...
            </div>
          ) : null}

          {!isLoading && tableRows.length === 0 ? (
            <div className="px-5 py-8 text-sm text-[var(--color-muted)]">
              No camera events found.
            </div>
          ) : null}

          {!isLoading && tableRows.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-black/6 text-left text-sm">
                  <thead className="bg-white/45 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    <tr>
                      <th className="px-5 py-4">Snapshot</th>
                      <th className="px-5 py-4">Captured</th>
                      <th className="px-5 py-4">Camera</th>
                      <th className="px-5 py-4">Count</th>
                      <th className="px-5 py-4">Event</th>
                      <th className="px-5 py-4">Status</th>
                      {canManage ? (
                        <th className="px-5 py-4 text-right">Actions</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6">
                    {tableRows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "bg-white/55 transition-colors",
                          newEventIds.has(row.id) && "bg-emerald-50/80",
                        )}
                      >
                        <td className="px-5 py-4">
                          {row.snapshotUrl ? (
                            <a
                              href={row.snapshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-16 w-28 overflow-hidden rounded-md border border-black/10 bg-black/[0.03]"
                            >
                              <img
                                src={row.snapshotUrl}
                                alt="Camera event snapshot"
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ) : (
                            <div className="flex h-16 w-28 items-center justify-center rounded-md border border-dashed border-black/12 bg-black/[0.03] text-xs text-[var(--color-muted)]">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="font-semibold text-[var(--color-ink)]">
                            {formatCapturedDateTime(row)}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-muted)]">
                            Event {formatDateTime(row.eventDateTime)}
                          </div>
                          {newEventIds.has(row.id) ? (
                            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              New
                            </span>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="font-semibold text-[var(--color-ink)]">
                            {row.channelName || `Channel ${row.channelId ?? 1}`}
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-muted)]">
                            {row.cameraIp || "-"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {isCountedEntry(row) ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              <Car className="h-3.5 w-3.5" />
                              Entry
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-muted)]">
                              Ignored
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-ink)]">
                              {row.eventType || "-"}
                            </span>
                            <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-semibold text-[var(--color-muted)]">
                              {row.eventState || "-"}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[var(--color-muted)]">
                            {row.eventDescription || row.source || "-"}
                          </div>
                        </td>
                        <td className="min-w-36 px-5 py-4">
                          {row.snapshotError ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                              title={row.snapshotError}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Failed
                            </span>
                          ) : row.snapshotUrl ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Saved
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-muted)]">
                              Pending
                            </span>
                          )}
                        </td>
                        {canManage ? (
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <Button
                                variant="danger"
                                size="sm"
                                loading={deletingId === row.id}
                                disabled={busy && deletingId !== row.id}
                                onClick={() => void handleDeleteCapture(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-black/6 lg:hidden">
                {tableRows.map((row) => (
                  <article
                    key={row.id}
                    className={cn(
                      "bg-white/55 p-5 transition-colors",
                      newEventIds.has(row.id) && "bg-emerald-50/80",
                    )}
                  >
                    <div className="flex gap-4">
                      {row.snapshotUrl ? (
                        <a
                          href={row.snapshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block h-20 w-28 shrink-0 overflow-hidden rounded-md border border-black/10 bg-black/[0.03]"
                        >
                          <img
                            src={row.snapshotUrl}
                            alt="Camera event snapshot"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </a>
                      ) : (
                        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-md border border-dashed border-black/12 bg-black/[0.03] text-xs text-[var(--color-muted)]">
                          No image
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--color-ink)]">
                          {formatCapturedDateTime(row)}
                        </p>
                        {newEventIds.has(row.id) ? (
                          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            New
                          </span>
                        ) : null}
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {row.channelName || `Channel ${row.channelId ?? 1}`}{" "}
                          -{" "}
                          {row.cameraIp || "-"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-semibold text-[var(--color-muted)]">
                            {row.eventType || "-"} {row.eventState || ""}
                          </span>
                          {isCountedEntry(row) ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              Entry
                            </span>
                          ) : null}
                        </div>
                        {canManage ? (
                          <Button
                            variant="danger"
                            size="sm"
                            loading={deletingId === row.id}
                            disabled={busy && deletingId !== row.id}
                            onClick={() => void handleDeleteCapture(row)}
                            className="mt-4 w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete capture
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <aside className="panel rounded-[28px] border border-black/8 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-black)] text-[var(--color-gold)]">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Camera settings
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                  Cooldown, snapshot capture, and Hikvision credentials.
                </p>
              </div>
            </div>
            <Switch
              checked={settingsForm.snapshotCaptureEnabled}
              disabled={busy || !canManage}
              onCheckedChange={(checked) =>
                setSettingsForm((current) => ({
                  ...current,
                  snapshotCaptureEnabled: checked,
                }))
              }
              aria-label="Enable snapshot capture"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Input
              type="number"
              min={0}
              max={3600}
              step={1}
              label="Cooldown seconds"
              value={settingsForm.cameraEventCooldownSeconds}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  cameraEventCooldownSeconds: clampCooldownSeconds(
                    event.target.value,
                  ),
                }))
              }
              disabled={busy || !canManage}
              icon={<Clock className="h-4 w-4" />}
            />
            <Input
              label="Camera IP"
              value={settingsForm.cameraIp}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  cameraIp: event.target.value,
                }))
              }
              disabled={busy || !canManage}
              placeholder="192.168.254.64"
            />
            <Input
              label="Username"
              value={settingsForm.username}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              disabled={busy || !canManage}
            />
            <Input
              type="password"
              label={
                settingsForm.passwordConfigured ? "Password saved" : "Password"
              }
              value={settingsForm.password}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              disabled={busy || !canManage}
              placeholder={
                settingsForm.passwordConfigured
                  ? "Leave blank to keep"
                  : "Camera password"
              }
            />
            <Input
              label="Snapshot channel"
              value={settingsForm.snapshotChannel}
              onChange={(event) =>
                setSettingsForm((current) => ({
                  ...current,
                  snapshotChannel: event.target.value,
                }))
              }
              disabled={busy || !canManage}
            />
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => void handleTestSnapshot()}
              disabled={
                busy ||
                !canManage ||
                !settingsForm.cameraIp.trim() ||
                !settingsForm.username.trim()
              }
              loading={isTesting}
              className="flex-1"
            >
              <Camera className="h-4 w-4" />
              Test
            </Button>
            <Button
              onClick={() => void handleSaveSettings()}
              disabled={busy || !canManage}
              loading={isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          {testSnapshotUrl ? (
            <a
              href={testSnapshotUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block aspect-video overflow-hidden rounded-md border border-black/10 bg-black/[0.03]"
            >
              <img
                src={testSnapshotUrl}
                alt="Hikvision test snapshot"
                className="h-full w-full object-cover"
              />
            </a>
          ) : null}

          {canManage ? (
            <Button
              variant="danger"
              onClick={() => void handleClearAll()}
              disabled={busy}
              loading={isClearing}
              className="mt-5 w-full"
            >
              <Trash2 className="h-4 w-4" />
              Clear all events
            </Button>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
