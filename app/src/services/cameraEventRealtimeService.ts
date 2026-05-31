import {
  HubConnectionBuilder,
  HubConnectionState,
} from "@microsoft/signalr";

export function getCameraEventHubUrl() {
  return "/hubs/camera-events";
}

export async function canReachCameraEventHub() {
  const response = await fetch("/api/realtime/camera-events/hub-status", {
    credentials: "include",
  }).catch(() => null);

  if (!response?.ok) {
    return false;
  }

  let payload = (await response.json().catch(() => null)) as
    | { available?: boolean; status?: number }
    | null;

  if (payload?.available) {
    return true;
  }

  if (payload?.status === 401) {
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then((refreshResponse) => refreshResponse.ok)
      .catch(() => false);

    if (!refreshed) {
      return false;
    }

    const retryResponse = await fetch("/api/realtime/camera-events/hub-status", {
      credentials: "include",
    }).catch(() => null);

    if (!retryResponse?.ok) {
      return false;
    }

    payload = (await retryResponse.json().catch(() => null)) as
      | { available?: boolean }
      | null;
  }

  return Boolean(payload?.available);
}

export function createCameraEventHubConnection() {
  return new HubConnectionBuilder()
    .withUrl(getCameraEventHubUrl(), {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .build();
}

export { HubConnectionState };
