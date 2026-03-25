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

export const getApiBaseCandidates = (): string[] => {
	const candidates = new Set<string>();

	if (configuredApiBaseUrl) {
		candidates.add(normalize(configuredApiBaseUrl));
	}

	candidates.add(normalize(fallbackApiBaseUrl));

	if (typeof window !== "undefined") {
		candidates.add(normalize(window.location.origin));

		const { hostname } = window.location;
		if (hostname.includes("onrender.com") && hostname.toLowerCase().includes("frontend")) {
			candidates.add(normalize(`https://${hostname.replace(/frontend/gi, "backend")}`));
		}

		if (hostname === "localhost" || hostname === "127.0.0.1") {
			candidates.add("http://127.0.0.1:8000");
			candidates.add("http://localhost:8000");
		}
	}

	return Array.from(candidates);
};

export const API_BASE_URL = getApiBaseCandidates()[0];
