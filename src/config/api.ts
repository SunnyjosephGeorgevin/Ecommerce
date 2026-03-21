const fallbackApiBaseUrl = "http://127.0.0.1:8000";

// Normalize trailing slash to avoid double-slash request URLs.
const normalizedApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl).replace(/\/$/, "");

export const API_BASE_URL = normalizedApiBaseUrl;
