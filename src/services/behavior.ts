import { API_BASE_URL } from "../config/api";

type BehaviorAction = "search" | "view" | "click" | "wishlist" | "cart" | "purchase" | "feedback";

type TrackBehaviorInput = {
  userId?: number;
  action: BehaviorAction;
  productId?: number;
  query?: string;
  score?: number;
  sessionId?: string;
  context?: Record<string, unknown>;
};

const getStoredUserId = (): number => {
  if (typeof window === "undefined") {
    return 1;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return 1;
  }

  try {
    const parsed = JSON.parse(raw) as { id?: string };
    const numericId = Number.parseInt(parsed.id ?? "", 10);
    return Number.isFinite(numericId) ? numericId : 1;
  } catch {
    return 1;
  }
};

const getSessionId = (): string => {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = localStorage.getItem("behaviorSessionId");
  if (existing) {
    return existing;
  }

  const generated = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem("behaviorSessionId", generated);
  return generated;
};

export const trackBehaviorEvent = async (input: TrackBehaviorInput): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/behavior/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: input.userId ?? getStoredUserId(),
        action: input.action,
        query: input.query,
        product_id: input.productId,
        score: input.score ?? 1,
        session_id: input.sessionId ?? getSessionId(),
        context_json: input.context ? JSON.stringify(input.context) : null,
      }),
    });
  } catch {
    // Tracking should never block UX.
  }
};
