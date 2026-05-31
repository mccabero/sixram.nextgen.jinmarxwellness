import { apiClient } from "@/lib/api";
import type {
  CameraEventQuery,
  CameraEventRow,
  CameraEventSettings,
  CameraEventSummary,
  CameraSnapshotTestResult,
  ClearCameraEventsResult,
  UpdateHikvisionCameraSettingsRequest,
} from "@/types/cameraEvent";

function appendQuery(params?: CameraEventQuery) {
  const query = new URLSearchParams();

  if (params?.take) {
    query.set("take", String(params.take));
  }

  if (params?.eventType) {
    query.set("eventType", params.eventType);
  }

  if (params?.eventState) {
    query.set("eventState", params.eventState);
  }

  if (params?.start) {
    query.set("start", params.start);
  }

  if (params?.end) {
    query.set("end", params.end);
  }

  if (params?.capturedStart) {
    query.set("capturedStart", params.capturedStart);
  }

  if (params?.capturedEnd) {
    query.set("capturedEnd", params.capturedEnd);
  }

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function normalizeCameraEvent(row: CameraEventRow): CameraEventRow {
  return {
    id: Number(row.id ?? 0),
    cameraIp: row.cameraIp ?? null,
    channelId: row.channelId ?? null,
    channelName: row.channelName ?? null,
    eventDateTime: String(row.eventDateTime ?? ""),
    eventType: String(row.eventType ?? ""),
    eventState: String(row.eventState ?? ""),
    eventDescription: row.eventDescription ?? null,
    activePostCount: row.activePostCount ?? null,
    source: row.source ?? null,
    snapshotUrl: row.snapshotUrl ?? null,
    snapshotCapturedAt: row.snapshotCapturedAt ?? null,
    snapshotError: row.snapshotError ?? null,
    createdAt: row.createdAt ?? null,
  };
}

function normalizeSettings(settings: CameraEventSettings): CameraEventSettings {
  return {
    cameraEventCooldownSeconds: Math.max(
      0,
      Math.min(3600, Number(settings.cameraEventCooldownSeconds ?? 60)),
    ),
    snapshotCaptureEnabled: Boolean(settings.snapshotCaptureEnabled),
    cameraIp: String(settings.cameraIp ?? ""),
    username: String(settings.username ?? "admin") || "admin",
    snapshotChannel: String(settings.snapshotChannel ?? "101") || "101",
    passwordConfigured: Boolean(settings.passwordConfigured),
  };
}

export const cameraEventService = {
  async getEvents(params?: CameraEventQuery) {
    const rows = await apiClient.get<CameraEventRow[]>(
      `/api/camera/hikvision/events${appendQuery(params)}`,
    );

    return rows.map(normalizeCameraEvent);
  },
  async getSummary(params?: CameraEventQuery) {
    const summary = await apiClient.get<CameraEventSummary>(
      `/api/camera/hikvision/summary${appendQuery(params)}`,
    );

    return {
      totalToday: Number(summary.totalToday ?? 0),
      activeToday: Number(summary.activeToday ?? 0),
      vmdActiveToday: Number(summary.vmdActiveToday ?? 0),
      total: Number(summary.total ?? 0),
      active: Number(summary.active ?? 0),
      vmdActive: Number(summary.vmdActive ?? 0),
      captured: Number(summary.captured ?? 0),
      snapshotFailed: Number(summary.snapshotFailed ?? 0),
      lastEvent: summary.lastEvent
        ? normalizeCameraEvent(summary.lastEvent)
        : null,
    } satisfies CameraEventSummary;
  },
  async clearEvents() {
    return apiClient.delete<ClearCameraEventsResult>(
      "/api/camera/hikvision/events",
    );
  },
  async deleteEvent(id: number) {
    return apiClient.delete<void>(`/api/camera/hikvision/events/${id}`);
  },
  async getSettings() {
    const settings = await apiClient.get<CameraEventSettings>(
      "/api/camera/hikvision/settings",
    );

    return normalizeSettings(settings);
  },
  async updateSettings(payload: UpdateHikvisionCameraSettingsRequest) {
    const settings = await apiClient.put<CameraEventSettings>(
      "/api/camera/hikvision/settings",
      payload,
    );

    return normalizeSettings(settings);
  },
  async testSnapshot(payload: UpdateHikvisionCameraSettingsRequest) {
    return apiClient.post<CameraSnapshotTestResult>(
      "/api/camera/hikvision/settings/test-snapshot",
      payload,
    );
  },
};
