import { motion } from "framer-motion";
import { Eye, GitCompare, Heart, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Product } from "../types";
import { useCart } from "../hooks/useContext";
import { useNavigate } from "react-router-dom";
import { trackBehaviorEvent } from "../services/behavior";

interface Props extends Product {}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  images,
  description,
  category,
  rating,
  reviews,
  stock,
}: Props) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [isRecentlyViewed, setIsRecentlyViewed] = useState(() => {
    if (typeof window === "undefined") return false;
    const recent = localStorage.getItem("recentlyViewedProducts");
    return recent ? JSON.parse(recent).includes(id) : false;
  });
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const secondaryImage = useMemo(() => {
    if (images && images.length > 1 && images[1]) {
      return images[1];
    }
    return image;
  }, [images, image]);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
  const soldThisWeek = (Number.parseInt(id, 10) * 7) % 130 + 18;
  const viewingNow = (Number.parseInt(id, 10) * 3) % 21 + 2;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const product: Product = {
      id,
      name,
      price,
      originalPrice,
      category,
      image,
      stock,
      description: "",
      rating,
      
      reviews,
      sellerId: "",
      sellerName: "",
      inStock: true,
    };
    addToCart(product);
    void trackBehaviorEvent({
      action: "cart",
      productId: Number.parseInt(id, 10),
      query: name,
      score: 1.5,
      context: { source: "product-card" },
    });
  };

  const handleOpenProduct = () => {
    if (typeof window !== "undefined") {
      const recent = localStorage.getItem("recentlyViewedProducts");
      const parsed: string[] = recent ? JSON.parse(recent) : [];
      const updated = [id, ...parsed.filter((item) => item !== id)].slice(0, 12);
      localStorage.setItem("recentlyViewedProducts", JSON.stringify(updated));
      setIsRecentlyViewed(true);
    }
    void trackBehaviorEvent({
      action: "click",
      productId: Number.parseInt(id, 10),
      query: name,
      score: 1.1,
      context: { source: "product-card" },
    });
    navigate(`/product/${id}`);
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("compareProducts");
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      const next = parsed.includes(id) ? parsed.filter((p) => p !== id) : [...parsed, id].slice(0, 4);
      localStorage.setItem("compareProducts", JSON.stringify(next));
      setIsCompared(next.includes(id));
    }
  };

  return (
    <motion.div
      className="group"
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
      onClick={handleOpenProduct}
    >
      <div className="relative overflow-hidden rounded-2xl cursor-pointer border border-slate-800 bg-gradient-to-b from-[#151824] to-[#090b12] hover:border-rose-500/70 transition-all duration-300 shadow-[0_12px_28px_rgba(2,6,23,0.35)]">
        {/* Image Container */}
        <div
          className="relative w-full aspect-square overflow-hidden bg-slate-900"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.img
            src={isHovered ? secondaryImage : image}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const fallback = `https://picsum.photos/seed/${encodeURIComponent(name)}/900/900`;
              if (e.currentTarget.src !== fallback) {
                e.currentTarget.src = fallback;
              }
            }}
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-rose-700 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
              -{discountPercent}%
            </div>
          )}

          {isRecentlyViewed && (
            <div className="absolute top-12 left-3 bg-slate-900/85 text-white px-2 py-1 rounded-md text-[10px] font-semibold border border-slate-700">
              Recently Viewed
            </div>
          )}

          {/* Stock Badge */}
          <div className="absolute top-3 right-3 bg-emerald-500/90 text-white px-2 py-1 rounded-md text-xs font-bold backdrop-blur">
            {(stock ?? 0) > 5 ? "In Stock" : "Low Stock"}
          </div>

          <div className="absolute top-12 right-3 flex gap-2">
            <button
              onClick={handleCompareToggle}
              className={`rounded-full p-2 border transition ${isCompared ? "bg-rose-600 text-white border-rose-300" : "bg-slate-900/80 text-slate-200 border-slate-700 hover:border-rose-500"}`}
              aria-label="Toggle compare"
            >
              <GitCompare size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickView(true);
              }}
              className="rounded-full p-2 border bg-slate-900/80 text-slate-200 border-slate-700 hover:border-rose-500 transition"
              aria-label="Quick view"
            >
              <Eye size={14} />
            </button>
          </div>

          {/* Wishlist Button */}
          <motion.button
            className="absolute bottom-3 left-3 bg-white/95 text-black p-2 rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </motion.button>

          {/* Add to Cart Button */}
          <motion.button
            className="absolute bottom-3 right-3 bg-gradient-to-br from-rose-500 to-rose-700 text-white p-2 rounded-full shadow-lg hover:from-rose-400 hover:to-rose-600 transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} />
          </motion.button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-[17px] font-semibold leading-snug group-hover:text-rose-300 transition-colors line-clamp-2">{name}</h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(rating) ? "text-yellow-500" : "text-gray-600"}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-slate-400">({reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            <p className="text-xl font-bold text-white">{formattedPrice}</p>
            {originalPrice && (
              <p className="text-sm text-slate-500 line-through">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(originalPrice)}
              </p>
            )}
          </div>

          {/* Category Tag */}
          <div className="mt-3 inline-block">
            <span className="text-xs px-3 py-1 bg-[#C8102E] text-white rounded-full font-semibold uppercase tracking-wide">
              {category}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>{soldThisWeek} sold this week</span>
            <span>{viewingNow} viewing now</span>
          </div>
        </div>
      </div>

      {showQuickView && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowQuickView(false)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-16 max-w-2xl rounded-2xl border border-slate-700 bg-[#0f1424] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img src={image} alt={name} className="w-full aspect-square rounded-xl object-cover border border-slate-700" />
              <div>
                <p className="text-xs text-rose-300 uppercase tracking-wide mb-2">Quick View</p>
                <h3 className="text-2xl font-bold mb-2">{name}</h3>
                <p className="text-slate-300 text-sm mb-4 line-clamp-4">{description || "Premium product with trusted quality and fast delivery."}</p>
                <p className="text-2xl font-bold text-white mb-4">{formattedPrice}</p>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      handleAddToCart(e);
                      setShowQuickView(false);
                    }}
                    className="premium-button-primary"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickView(false);
                      handleOpenProduct();
                    }}
                    className="premium-button-secondary"
                  >
                    Open Product
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}