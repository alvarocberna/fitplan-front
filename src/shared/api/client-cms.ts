const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const CMS_NETWORK_ERROR_MESSAGE = 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
const CMS_GENERIC_ERROR_MESSAGE = 'Ocurrió un error inesperado. Intenta nuevamente.';

// Error de una llamada al backend CMS. `status` es el HTTP status (0 si no hubo respuesta), para que
// quien lo atrapa pueda distinguir, p. ej., un 404 de un fallo de red.
export class CmsApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'CmsApiError';
  }
}

// fetch solo rechaza cuando no hubo respuesta (CMS caído, sin red): se traduce a un mensaje legible.
async function fetchCms(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new CmsApiError(CMS_NETWORK_ERROR_MESSAGE, 0);
  }
}

// Convierte una respuesta no-2xx en CmsApiError. Solo se muestra el `message` del CMS si es un texto;
// un cuerpo que no es JSON (o un 5xx sin mensaje) usa el genérico, nunca "Error HTTP 502".
async function toCmsError(res: Response): Promise<CmsApiError> {
  let errorData: { message?: unknown } | null = null;
  try {
    errorData = await res.json();
  } catch {
    // cuerpo no-JSON
  }
  const candidate = Array.isArray(errorData?.message) ? errorData.message[0] : errorData?.message;
  const message = typeof candidate === 'string' && candidate.trim() ? candidate : CMS_GENERIC_ERROR_MESSAGE;
  return new CmsApiError(message, res.status);
}

/** Lee el CSRF token de la cookie; si no existe, lo solicita al backend. */
async function ensureCsrfToken(): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  try {
    const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
    if (res.ok) {
      const data: { csrfToken: string } = await res.json();
      return data.csrfToken ?? null;
    }
  } catch {
    // silent fail — la request mutante simplemente irá sin token
  }
  return null;
}

const getBaseUrl = () => {
  // En el browser → usa rewrite de Next
  if (typeof window !== 'undefined') {
    return '/api';
  }

  // En el servidor (SSR / server actions)
  return process.env.NEXT_PUBLIC_BACKEND_CMS_URL || 'http://localhost:3001';
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  // una sola llamada de refresh compartida entre requests concurrentes
  if (refreshPromise) return refreshPromise;

  const refreshHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  const csrfForRefresh = await ensureCsrfToken();
  if (csrfForRefresh) refreshHeaders['X-CSRF-Token'] = csrfForRefresh;

  refreshPromise = fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: refreshHeaders,
  })
    .then(res => res.ok)
    // un fallo de red del propio refresh equivale a "no se pudo refrescar": no debe propagarse
    .catch(() => false)
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

export async function apiFetchCMS<T>(
  endpoint: string,
  method: string = 'GET',
  data?: unknown,
  credentials: RequestCredentials = 'include',
  isRetry = false // evita loop infinito
): Promise<T> {
  const baseUrl = getBaseUrl();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (MUTATING_METHODS.has(method.toUpperCase())) {
    const csrf = await ensureCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetchCms(`${baseUrl}/${endpoint}`, {
    method,
    credentials,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // 🔁 Manejo de access token expirado
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();

    if (refreshed) {
      return apiFetchCMS<T>(endpoint, method, data, credentials, true);
    }

    throw new CmsApiError('Sesión expirada', 401);
  }

  // ❌ errores HTTP
  if (!res.ok) {
    throw await toCmsError(res);
  }

  // ✅ 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  // ✅ cuerpo vacío
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiFetchFormData<T>(
  endpoint: string,
  formData: FormData,
  method: string = 'POST',
  credentials: RequestCredentials = 'include',
  isRetry = false
): Promise<T> {
  const baseUrl = getBaseUrl();

  const headers: Record<string, string> = {};
  if (MUTATING_METHODS.has(method.toUpperCase())) {
    const csrf = await ensureCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetchCms(`${baseUrl}/${endpoint}`, {
    method,
    credentials,
    headers: Object.keys(headers).length ? headers : undefined,
    body: formData,
  });

  // 🔁 refresh si 401
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();

    if (refreshed) {
      return apiFetchFormData<T>(
        endpoint,
        formData,
        method,
        credentials,
        true
      );
    }

    throw new CmsApiError('Sesión expirada', 401);
  }

  if (!res.ok) {
    throw await toCmsError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}