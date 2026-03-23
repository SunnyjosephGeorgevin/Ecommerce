const normalize = (value: string) => value.replace(/\/$/, "");

const getRuntimeFallbackApiBaseUrl = () => {
	if (typeof window === "undefined") {
		return "http://127.0.0.1:8000";
	}

	const { origin, hostname } = window.location;

	// Useful convention when frontend/backend services are named similarly on Render.
	if (hostname.includes("onrender.com") && hostname.toLowerCase().includes("frontend")) {
		const backendHost = hostname.replace(/frontend/gi, "backend");
		return `https://${backendHost}`;
	}

	// Same-origin fallback for reverse-proxy deployments.
	return origin;
};

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const fallbackApiBaseUrl = import.meta.env.DEV
	? "http://127.0.0.1:8000"
	: getRuntimeFallbackApiBaseUrl();

export const API_BASE_URL = normalize(configuredApiBaseUrl || fallbackApiBaseUrl);
