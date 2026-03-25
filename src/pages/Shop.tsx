import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../hooks/useContext";
import { API_BASE_URL } from "../config/api";
import { trackBehaviorEvent } from "../services/behavior";

type RecommendationProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
};

type RealtimeRecommendationsResponse = {
  recommendations: RecommendationProduct[];
};

const getRecommendationReason = (product: RecommendationProduct, activeCategory?: string): string => {
  if (activeCategory && product.category === activeCategory) {
    return "Because it matches your current category";
  }

  if (product.price <= 300) {
    return "Because you explore budget-friendly picks";
  }

  if (product.price >= 1200) {
    return "Because you browse premium products";
  }

  return "Because it matches your recent activity";
};

const SHOP_CATEGORY_COPY: Record<string, string> = {
  laptop: "Explore high-performance laptops for work, gaming, and creativity.",
  mobile: "Find flagship and budget smartphones with powerful cameras and battery life.",
  fashion: "Discover trend-forward fashion picks curated for everyday and occasion wear.",
  footwear: "Step into comfort with sneakers and footwear designed for style and performance.",
  sneakers: "Shop premium sneakers from top brands built for comfort and street style.",
  apparel: "Upgrade your wardrobe with premium apparel for casual and active lifestyles.",
  accessories: "Complete your look with watches, bags, eyewear, and lifestyle accessories.",
  "new-arrivals": "Check out the latest drops freshly added to the store.",
};

const SHOP_CATEGORY_TITLES: Record<string, string> = {
  laptop: "Laptops",
  mobile: "Mobiles",
  fashion: "Fashion",
  footwear: "Footwear",
  sneakers: "Sneakers",
  apparel: "Apparel",
  accessories: "Accessories",
  "new-arrivals": "New Arrivals",
};

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category")?.toLowerCase() ?? undefined;
  const { fetchProducts } = useProducts();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationProduct[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const pageTitle =
    (category && SHOP_CATEGORY_TITLES[category]) ||
    "Shop All Products";
  const pageDescription =
    (category && SHOP_CATEGORY_COPY[category]) ||
    "Discover our complete collection of premium products.";

  useEffect(() => {
    fetchProducts(category);
  }, [category, fetchProducts]);

  useEffect(() => {
    void trackBehaviorEvent({
      action: "search",
      query: category ? `shop-category:${category}` : "shop-category:all",
      score: 0.9,
      context: { source: "shop-page", category: category ?? "all" },
    });
  }, [category]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id) {
        setRecommendations([]);
        return;
      }

      setRecommendationsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/recommendations/realtime/${user.id}?limit=8`);
        if (!response.ok) {
          throw new Error("Failed to load recommendations");
        }

        const payload = (await response.json()) as RealtimeRecommendationsResponse;
        setRecommendations(payload.recommendations || []);
      } catch {
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    void fetchRecommendations();
  }, [user?.id]);

  const visibleRecommendations = useMemo(() => recommendations.slice(0, 4), [recommendations]);

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden border-b border-slate-800 bg-[radial-gradient(circle_at_20%_10%,rgba(225,29,72,0.14),transparent_35%),linear-gradient(180deg,#161a28_0%,#0b0b0d_85%)] py-16"
      >
        <div className="pointer-events-none absolute -top-16 right-16 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-200">
            Shop
          </span>
          <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight">
            {pageTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300 text-base md:text-xl leading-relaxed">
            {pageDescription}
          </p>
        </div>
      </motion.div>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">Personalized For You</h2>
            {recommendationsLoading && <span className="text-xs text-slate-400">Refreshing...</span>}
          </div>

          {!recommendationsLoading && visibleRecommendations.length === 0 && (
            <p className="text-sm text-slate-400">Browse products to unlock personalized picks here.</p>
          )}

          {visibleRecommendations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {visibleRecommendations.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    const reason = getRecommendationReason(product, category);
                    void trackBehaviorEvent({
                      action: "click",
                      productId: product.id,
                      query: product.name,
                      score: 1.1,
                      context: { source: "shop-recommendations", reason },
                    });
                    navigate(`/product/${product.id}`);
                  }}
                  className="text-left rounded-xl border border-slate-800 bg-[#111522] p-3 hover:border-rose-500/70 transition"
                >
                  <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                  <p className="mb-2 inline-flex rounded-full border border-rose-500/35 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-200">
                    {getRecommendationReason(product, category)}
                  </p>
                  <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
                  <p className="text-rose-300 text-sm mt-1">${product.price}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <ProductGrid initialCategory={category} />
    </div>
  );
}
