export type CameraEventRow = {
  id: number;
  cameraIp?: string | null;
  channelId?: number | null;
  channelName?: string | null;
  eventDateTime: string;
  eventType: string;
  eventState: string;
  eventDescription?: string | null;
  activePostCount?: number | null;
  source?: string | null;
  snapshotUrl?: string | null;
  snapshotCapturedAt?: string | null;
  snapshotError?: string | null;
  createdAt?: string | null;
};

export type CameraEventSummary = {
  totalToday: number;
  activeToday: number;
  vmdActiveToday: number;
  total: number;
  active: number;
  vmdActive: number;
  captured: number;
  snapshotFailed: number;
  lastEvent?: CameraEventRow | null;
};

export type CameraEventQuery = {
  take?: number;
  eventType?: string;
  eventState?: string;
  start?: string;
  end?: string;
  capturedStart?: string;
  capturedEnd?: string;
};

export type CameraEventSettings = {
  cameraEventCooldownSeconds: number;
  snapshotCaptureEnabled: boolean;
  cameraIp: string;
  username: string;
  snapshotChannel: string;
  passwordConfigured: boolean;
};

export type UpdateHikvisionCameraSettingsRequest = {
  cameraEventCooldownSeconds?: number;
  snapshotCaptureEnabled?: boolean;
  cameraIp?: string;
  username?: string;
  password?: string;
  snapshotChannel?: string;
};

export type ClearCameraEventsResult = {
  deletedCount: number;
};

export type CameraSnapshotTestResult = {
  capturedAt: string;
  imageDataUrl: string;
};
