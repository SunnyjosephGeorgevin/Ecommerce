import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../context/ProductContext";

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
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category")?.toLowerCase() ?? undefined;
  const { fetchProducts } = useProducts();
  const pageTitle =
    (category && SHOP_CATEGORY_TITLES[category]) ||
    "Shop All Products";
  const pageDescription =
    (category && SHOP_CATEGORY_COPY[category]) ||
    "Discover our complete collection of premium products.";

  useEffect(() => {
    fetchProducts(category);
  }, [category, fetchProducts]);

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

      <ProductGrid initialCategory={category} />
    </div>
  );
}
