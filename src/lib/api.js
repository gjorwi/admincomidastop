const API_PATH = "/api";

const TOKEN_KEY = "dondecomo:admin-token";

export class ApiError extends Error {
  constructor(message, status = 0, path = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

export function getToken() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("dondecomo:admin-token"));
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  let response;

  try {
    response = await fetch(`${API_PATH}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con la API. Verifica que el servidor esté activo.",
      0,
      path,
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) setToken("");
    throw new ApiError(
      payload.message || `Error ${response.status} al consultar la API.`,
      response.status,
      path,
    );
  }

  return payload;
}

export async function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
