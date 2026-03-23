import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

type ProductPreview = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category?: string;
};

type AgentResponse = {
  intent?: string;
  filters?: {
    category?: string;
    max_price?: number;
    min_price?: number;
    keywords?: string[];
  };
  message?: string;
  suggestions?: string[];
  results?: ProductPreview[];
  recommendations?: ProductPreview[];
};

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp?: string;
  explanation?: string;
  products?: ProductPreview[];
  suggestions?: string[];
};

const botGreeting: ChatMessage = {
  id: "greeting",
  role: "bot",
  text: "Hi! I am Spectral-X your shopping assistant. Ask for products by type, budget, or brand.",
  suggestions: ["Under 500", "Premium", "Sneakers", "Accessories"],
};

const imageFallback =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=400&q=80";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [botGreeting];
    }
    const stored = localStorage.getItem("chatHistory");
    return stored ? JSON.parse(stored) : [botGreeting];
  });
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages]);

  const contextualChips = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    if (location.pathname.startsWith("/product/")) {
      return ["Show similar products", "Under 500", "Top rated alternatives"];
    }
    if (location.pathname.startsWith("/shop") && category) {
      return [`Show more ${category}`, `${category} under 1500`, `Best ${category} deals`];
    }
    return ["Under 500", "Premium", "Sneakers", "Accessories"];
  }, [location.pathname, location.search]);

  const sendMessage = async (rawInput?: string) => {
    const prompt = (rawInput ?? input).trim();
    if (!prompt || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!rawInput) {
      setInput("");
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/agent/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          user_id: 1,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const data: AgentResponse = await res.json();
      const products = [...(data.results ?? []), ...(data.recommendations ?? [])];
      const uniqueProducts = Array.from(new Map(products.map((p) => [p.id, p])).values());

      // Fake typing delay for a more conversational feel.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const botMessage: ChatMessage = {
        id: `${Date.now()}-bot`,
        role: "bot",
        text: data.message || "I found a few options for you.",
        timestamp: new Date().toISOString(),
        explanation: data.filters
          ? `Reason: ${data.filters.category ? `category ${data.filters.category}` : "general"}${data.filters.max_price ? `, budget <= ${data.filters.max_price}` : ""}${data.filters.keywords?.length ? `, keywords ${data.filters.keywords.join(", ")}` : ""}`
          : undefined,
        products: uniqueProducts,
        suggestions: data.suggestions ?? [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot-error`,
          role: "bot",
          text: "Sorry, I could not reach the assistant service. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
    setIsOpen(false);
  };

  const handleQuickReply = async (reply: string) => {
    await sendMessage(reply);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="relative mb-4 w-[min(430px,calc(100vw-1rem))] h-[min(76vh,640px)] sm:h-[620px] rounded-[26px] border border-[#334155]/65 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,0.12),transparent_35%),radial-gradient(circle_at_85%_88%,rgba(56,189,248,0.12),transparent_32%),linear-gradient(160deg,#090b12_0%,#0f1220_58%,#101625_100%)] shadow-[0_24px_80px_rgba(5,8,20,0.75)] overflow-hidden flex flex-col"
          >
            <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#fb7185]/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-[#22d3ee]/20 blur-2xl" />

            <div className="h-[74px] border-b border-[#334155]/70 px-4 sm:px-5 flex items-center justify-between bg-black/15 backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ef4444] via-[#e11d48] to-[#7f1d1d] flex items-center justify-center shadow-[0_10px_24px_rgba(239,68,68,0.35)]">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] leading-tight font-semibold text-white tracking-wide">Spectral-X</p>
                  <p className="text-[11px] text-slate-300/90">Your AI Shopping Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  live
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-300 hover:text-white transition-colors duration-200"
                  aria-label="Close chat"
                >
                <X size={18} />
                </button>
              </div>
            </div>

            <div ref={containerRef} className="chatbot-scroll flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4">
              {messages.map((message, idx) => {
                const currentDate = message.timestamp ? new Date(message.timestamp).toDateString() : "Today";
                const prevDate = idx > 0 && messages[idx - 1].timestamp ? new Date(messages[idx - 1].timestamp as string).toDateString() : currentDate;
                const showDateChip = idx === 0 || currentDate !== prevDate;
                return (
                  <div key={message.id}>
                    {showDateChip && (
                      <div className="text-center text-[10px] text-slate-400 mb-2">{currentDate}</div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                  <div
                    className={`max-w-[90%] sm:max-w-[86%] rounded-2xl px-3 py-2.5 border ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-[#ef4444] to-[#be123c] text-white border-[#f87171]/40 shadow-[0_8px_24px_rgba(225,29,72,0.35)]"
                        : "bg-[#101522]/88 text-slate-100 border-[#334155]/70"
                    }`}
                  >
                    <div className="text-[12.5px] leading-relaxed whitespace-pre-line">{message.text}</div>
                    {message.explanation && (
                      <p className="mt-1 text-[10px] text-slate-400">{message.explanation}</p>
                    )}

                    {message.products && message.products.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-2.5">
                        {message.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product.id)}
                            className="w-full text-left rounded-xl border border-[#334155]/70 bg-gradient-to-br from-[#0b1020] to-[#111827] p-2.5 hover:border-[#f43f5e]/70 hover:shadow-[0_10px_28px_rgba(15,23,42,0.6)] transition-all duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={product.image_url || imageFallback}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover border border-[#475569]/60"
                                onError={(e) => {
                                  e.currentTarget.src = imageFallback;
                                }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{product.name}</p>
                                <div className="mt-0.5 flex items-center gap-1.5">
                                  <p className="text-xs text-rose-200/95">{formatPrice(product.price)}</p>
                                  {product.category && (
                                    <span className="text-[10px] uppercase tracking-wide rounded-full border border-[#334155] px-1.5 py-0.5 text-slate-300">
                                      {product.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.slice(0, 4).map((suggestion) => (
                          <button
                            key={`${message.id}-${suggestion}`}
                            onClick={() => void handleQuickReply(suggestion)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-[#475569]/70 bg-[#111827]/80 text-slate-200 hover:border-[#f43f5e]/70 hover:text-white transition-all duration-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                    </motion.div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#111827]/90 border border-[#334155]/80 rounded-2xl px-3 py-2 text-slate-300 text-xs flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Curating options...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#334155]/70 p-3 sm:p-4 bg-black/15 backdrop-blur-xl">
              <div className="flex flex-wrap gap-2 mb-2.5">
                {contextualChips.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => void handleQuickReply(reply)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#334155]/80 bg-[#0f172a]/85 text-slate-200 hover:border-[#fb7185] hover:text-white transition-all duration-200"
                    disabled={loading}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for products..."
                  className="flex-1 bg-[#0f172a]/90 border border-[#334155] text-white placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#fb7185]"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#be123c] text-white flex items-center justify-center shadow-[0_10px_24px_rgba(190,24,93,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#be123c] text-white shadow-[0_16px_40px_rgba(190,24,93,0.45)] border border-[#fb7185]/40 flex items-center justify-center"
        aria-label="Open AI assistant"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
}
