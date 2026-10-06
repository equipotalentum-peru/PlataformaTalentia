const ZOOM_API_URL = "https://api.zoom.us/v2";
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";

type ZoomMeetingResponse = {
  id: number;
  uuid?: string;
  join_url: string;
  start_url: string;
};

type ZoomRecordingFile = {
  id: string;
  file_type?: string;
  file_extension?: string;
  recording_type?: string;
  play_url?: string;
  share_url?: string;
  download_url?: string;
  status?: string;
};

type ZoomRecordingsResponse = {
  meeting_id?: string;
  recording_count?: number;
  recording_files?: ZoomRecordingFile[];
};

let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

function requireZoomEnv() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Faltan las credenciales ZOOM_* en el .env del backend.");
  }

  return { accountId, clientId, clientSecret };
}

async function obtenerTokenZoom(): Promise<string> {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.accessToken;
  }

  const { accountId, clientId, clientSecret } = requireZoomEnv();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(
    `${ZOOM_TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || typeof data.access_token !== "string") {
    throw new Error(
      `Zoom OAuth falló (${response.status}): ${JSON.stringify(data)}`
    );
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + Number(data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

async function zoomRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await obtenerTokenZoom();

  const response = await fetch(`${ZOOM_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message =
      data?.message ??
      data?.reason ??
      `Error HTTP ${response.status}`;

    throw new Error(`Zoom API (${response.status}): ${message}`);
  }

  return data as T;
}

function normalizarFechaHoraZoom(
  fechaHora: string
) {
  const valor = String(fechaHora);

  const match = valor.match(
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/
  );

  if (!match) {
    throw new Error(
      `Fecha/hora inválida para Zoom: ${fechaHora}`
    );
  }

  return `${match[1]}:00`;
}

export async function crearReunionZoom(input: {
  topic: string;
  startTime: string;
  durationMinutes: number;
}) {
  return zoomRequest<ZoomMeetingResponse>(
    "/users/me/meetings",
    {
      method: "POST",
      body: JSON.stringify({
        topic: input.topic,
        type: 2,

        start_time:
          normalizarFechaHoraZoom(
            input.startTime
          ),

        duration: input.durationMinutes,

        timezone: "America/Lima",

        settings: {
          auto_recording: "cloud",
          waiting_room: false,
        },
      }),
    }
  );
}

export async function actualizarReunionZoom(
  meetingId: string,
  input: {
    topic: string;
    startTime: string;
    durationMinutes: number;
  }
) {
  await zoomRequest<void>(
    `/meetings/${encodeURIComponent(
      meetingId
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        topic: input.topic,

        start_time:
          normalizarFechaHoraZoom(
            input.startTime
          ),

        duration: input.durationMinutes,

        timezone: "America/Lima",
      }),
    }
  );
}

export async function eliminarReunionZoom(meetingId: string) {
  await zoomRequest<void>(`/meetings/${encodeURIComponent(meetingId)}`, {
    method: "DELETE",
  });
}

export async function obtenerReunionZoom(meetingId: string) {
  return zoomRequest<ZoomMeetingResponse>(
    `/meetings/${encodeURIComponent(meetingId)}`
  );
}

export async function obtenerGrabacionesZoom(meetingId: string) {
  return zoomRequest<ZoomRecordingsResponse>(
    `/meetings/${encodeURIComponent(meetingId)}/recordings`
  );
}

export function extraerMeetingIdDesdeUrl(url: string | null | undefined) {
  if (!url) return null;

  const normalized = String(url);

  const directMatch = normalized.match(/\/j\/(\d{8,})/);
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  const genericMatch = normalized.match(/(\d{8,})(?:\?|$)/);
  return genericMatch?.[1] ?? null;
}
