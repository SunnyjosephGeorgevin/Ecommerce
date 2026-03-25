import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../hooks/useContext";
import { API_BASE_URL } from "../config/api";

type RecommendationProduct = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category?: string;
};

type RealtimeRecommendationsResponse = {
  recommendations: RecommendationProduct[];
};

const getRecommendationReason = (product: { category?: string; price: number }): string => {
  if (product.category === "mobile" || product.category === "laptop") {
    return "Because you browse electronics often";
  }

  if (product.category === "sneakers" || product.category === "footwear") {
    return "Because you explore footwear trends";
  }

  if (product.price <= 300) {
    return "Because you check value picks";
  }

  if (product.price >= 1200) {
    return "Because you engage with premium items";
  }

  return "Because it matches your recent activity";
};

export default function Home() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { user } = useAuth();
  const [realtimeRecommendations, setRealtimeRecommendations] = useState<RecommendationProduct[]>([]);

  const recentProductIds = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    const raw = localStorage.getItem("recentlyViewedProducts");
    return raw ? (JSON.parse(raw) as string[]) : [];
  }, []);

  const continueBrowsing = useMemo(
    () => products.filter((product) => recentProductIds.includes(product.id)).slice(0, 4),
    [products, recentProductIds]
  );

  const trendingCategory = continueBrowsing[0]?.category;
  const trending = useMemo(
    () => products.filter((product) => (trendingCategory ? product.category === trendingCategory : true)).slice(0, 4),
    [products, trendingCategory]
  );

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id) {
        setRealtimeRecommendations([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/recommendations/realtime/${user.id}?limit=4`);
        if (!response.ok) {
          throw new Error("Failed to load realtime recommendations");
        }

        const payload = (await response.json()) as RealtimeRecommendationsResponse;
        setRealtimeRecommendations(payload.recommendations || []);
      } catch {
        setRealtimeRecommendations([]);
      }
    };

    void fetchRecommendations();
  }, [user?.id]);

  const recommended = useMemo(() => {
    if (realtimeRecommendations.length > 0) {
      return realtimeRecommendations.map((product) => ({
        id: String(product.id),
        name: product.name,
        price: product.price,
        image: product.image_url,
        category: product.category,
      }));
    }

    return products.slice(0, 4).map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    }));
  }, [products, realtimeRecommendations]);

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />
      <Hero />

      {recommended.length > 0 && (
        <section className="py-14 bg-[#0b0b0d]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6">Recommended For You</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="text-left rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:border-rose-500/70 transition"
                >
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                  <p className="mb-2 inline-flex rounded-full border border-rose-500/35 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-200">
                    {getRecommendationReason(product)}
                  </p>
                  <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
                  <p className="text-rose-300 text-sm mt-1">${product.price}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {continueBrowsing.length > 0 && (
        <section className="py-10 bg-[#0d1019] border-y border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-5">Continue Browsing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {continueBrowsing.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="text-left rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:border-rose-500/70 transition"
                >
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                  <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
                  <p className="text-rose-300 text-sm mt-1">${product.price}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {trending.length > 0 && (
        <section className="py-14 bg-[#0b0b0d]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2">
              {trendingCategory ? `Trending In ${trendingCategory}` : "Trending Now"}
            </h2>
            <p className="text-slate-400 mb-6">Popular picks users are exploring this week.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trending.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="text-left rounded-xl border border-slate-800 bg-slate-900/40 p-3 hover:border-rose-500/70 transition"
                >
                  <img src={product.image} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
                  <p className="text-sm font-semibold line-clamp-1">{product.name}</p>
                  <p className="text-rose-300 text-sm mt-1">${product.price}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProductGrid />

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-[#0B0B0D] to-[#121726]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-12 text-center"
          >
            Why Choose SpectraCart
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                description: "Complimentary shipping on orders over $100. Fast delivery to your doorstep.",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                description: "30-day hassle-free return policy. No questions asked.",
              },
              {
                icon: Shield,
                title: "Authentic Guarantee",
                description: "100% authentic products from trusted sellers. Your satisfaction is guaranteed.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/85 to-[#0b0b0d] p-8 text-center hover:border-rose-500/70 transition-all duration-300 hover:-translate-y-1"
                >
                  <motion.div
                    className="mb-4 inline-flex rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className="text-[#C8102E] text-5xl" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-rose-700 via-rose-600 to-red-700">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Shop?</h2>
          <p className="text-white/95 text-lg mb-8">
            Discover our exclusive collection of premium sneakers, apparel, and accessories
          </p>
          <motion.button
            onClick={() => navigate("/shop")}
            className="bg-white text-rose-700 px-8 py-4 rounded-xl font-black text-lg flex items-center gap-3 mx-auto shadow-[0_16px_34px_rgba(127,29,29,0.35)] hover:shadow-[0_22px_40px_rgba(127,29,29,0.45)] transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Shopping
            <ArrowRight size={24} />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0B0D] border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">SpectraCart</h3>
              <p className="text-slate-400 text-sm">Premium e-commerce platform for sneakers, apparel, and accessories.</p>
            </div>
            {[
              { title: "Shop", links: ["New Arrivals", "Sneakers", "Apparel", "Accessories"] },
              { title: "Company", links: ["About Us", "Contact", "Careers", "Blog"] },
              { title: "Support", links: ["Help Center", "FAQs", "Shipping Info", "Returns"] },
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-400 hover:text-white text-sm transition">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-slate-500 text-sm text-center">© 2024 SpectraCart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}