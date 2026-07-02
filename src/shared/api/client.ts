export async function apiFetch<T>(
    endpoint: string,
    method?: string,
    data?: any,
): Promise<T>{

    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    const res = await fetch(`${url}/${endpoint}`, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: data ? JSON.stringify(data) : undefined,
    })

    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch {
            errorData = { message: `Error HTTP ${res.status}: ${res.statusText}` };
        }
        throw new Error(errorData?.message || errorData?.error || `Error HTTP ${res.status}`);
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}
