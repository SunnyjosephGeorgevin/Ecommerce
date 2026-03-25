import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Share2, Truck, RotateCcw, ShieldCheck, ChevronLeft } from "lucide-react";
import { useCart } from "../hooks/useContext";
import { useAuth } from "../hooks/useContext";
import { useProducts } from "../context/ProductContext";
import { SIZE_BASED_CATEGORIES } from "../constants/categories";
import { API_BASE_URL } from "../config/api";
import { trackBehaviorEvent } from "../services/behavior";

type FeedbackItem = {
  id: number;
  user_id: number;
  product_id: number | null;
  rating: number;
  comment: string | null;
  source: string;
  created_at: string;
};

type FeedbackSummary = {
  count: number;
  avg_rating: number;
  product_id: number | null;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { products } = useProducts();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    if (!product || typeof window === "undefined") {
      return;
    }
    const recent = localStorage.getItem("recentlyViewedProducts");
    const parsed: string[] = recent ? JSON.parse(recent) : [];
    const updated = [product.id, ...parsed.filter((item) => item !== product.id)].slice(0, 12);
    localStorage.setItem("recentlyViewedProducts", JSON.stringify(updated));
    void trackBehaviorEvent({
      action: "view",
      productId: Number.parseInt(product.id, 10),
      query: product.name,
      score: 1,
      context: { source: "product-detail" },
    });
  }, [product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    const loadFeedback = async () => {
      setFeedbackLoading(true);
      setFeedbackError(null);
      try {
        const summaryPromise = fetch(`${API_BASE_URL}/feedback/summary?product_id=${product.id}`);
        const listPromise = fetch(`${API_BASE_URL}/feedback?product_id=${product.id}`);

        const [summaryResponse, listResponse] = await Promise.all([summaryPromise, listPromise]);

        if (!summaryResponse.ok) {
          throw new Error("Failed to load feedback summary");
        }
        if (!listResponse.ok) {
          throw new Error("Failed to load feedback list");
        }

        const summaryData = (await summaryResponse.json()) as FeedbackSummary;
        const listData = (await listResponse.json()) as FeedbackItem[];

        setFeedbackSummary(summaryData);
        setFeedbackList(listData.slice(0, 6));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load feedback";
        setFeedbackError(message);
      } finally {
        setFeedbackLoading(false);
      }
    };

    void loadFeedback();
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <button
            onClick={() => navigate("/shop")}
            className="premium-button-primary"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const images = product.images || [product.image];
  const normalizedCategory = product.category.trim().toLowerCase();
  const showSizeSelection = SIZE_BASED_CATEGORIES.has(normalizedCategory);
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Red", "Navy"];

  const handleAddToCart = () => {
    addToCart(product);
    void trackBehaviorEvent({
      action: "cart",
      productId: Number.parseInt(product.id, 10),
      query: product.name,
      score: 1.6,
      context: { source: "product-detail" },
    });
  };

  const handleSubmitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoggedIn || !user) {
      setFeedbackError("Please login to submit feedback.");
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number.parseInt(user.id, 10),
          product_id: Number.parseInt(product.id, 10),
          rating: feedbackRating,
          comment: feedbackComment.trim() || null,
          source: "ui-product-detail",
        }),
      });

      if (!response.ok) {
        let detail = "Failed to submit feedback";
        try {
          const body = await response.json();
          detail = body.detail || detail;
        } catch {
          // Keep fallback detail.
        }
        throw new Error(detail);
      }

      const created = (await response.json()) as FeedbackItem;
      setFeedbackList((prev) => [created, ...prev].slice(0, 6));
      setFeedbackSummary((prev) => {
        const nextCount = (prev?.count || 0) + 1;
        const previousTotal = (prev?.avg_rating || 0) * (prev?.count || 0);
        const nextAverage = (previousTotal + created.rating) / nextCount;
        return {
          count: nextCount,
          avg_rating: Number(nextAverage.toFixed(2)),
          product_id: Number.parseInt(product.id, 10),
        };
      });

      setFeedbackComment("");
      setFeedbackRating(5);
      setFeedbackSuccess("Thanks! Your feedback was submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit feedback";
      setFeedbackError(message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#C8102E] mb-8 transition p-2 -ml-2"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Back</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative bg-[#1a1a1f] rounded-xl overflow-hidden mb-4">
              <motion.img
                key={selectedImage}
                src={images[selectedImage]}
                alt={product.name}
                className="w-full aspect-square object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                onError={(e) => {
                  const fallback = `https://picsum.photos/seed/${encodeURIComponent(product.name)}/900/900`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute top-4 left-4 bg-[#C8102E] text-white px-3 py-1 rounded-full text-sm font-bold">
                Limited Edition
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-3">
              {images.map((img, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === idx ? "border-[#C8102E]" : "border-gray-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const fallback = `https://picsum.photos/seed/${encodeURIComponent(product.name)}-${idx}/900/900`;
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-24"
          >
            <div className="mb-6">
              <span className="text-[#C8102E] text-sm font-semibold tracking-widest">{product.category.toUpperCase()}</span>
              <h1 className="text-4xl lg:text-5xl font-black mt-2 leading-tight">{product.name}</h1>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-800">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.floor(product.rating) ? "text-yellow-500 text-lg" : "text-gray-600 text-lg"}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-400">{product.reviews} reviews</span>
              <span className="text-[#C8102E] font-semibold">{product.rating}/5</span>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-black text-white">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
                )}
              </div>
              <p className="text-green-500 font-semibold">You save ${(product.originalPrice ? product.originalPrice - product.price : 0)}</p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Size Selection */}
            {showSizeSelection && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Size</h3>
                <div className="grid grid-cols-6 gap-2">
                  {sizes.map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 rounded-lg font-semibold transition ${
                        selectedSize === size
                          ? "bg-[#C8102E] text-white"
                          : "bg-[#1a1a1f] text-white hover:border-[#C8102E] border border-gray-700"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Color</h3>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <motion.button
                    key={color}
                    className={`px-4 py-2 rounded-lg border-2 transition ${
                      color === "Black"
                        ? "border-[#C8102E] bg-black"
                        : "border-gray-700 hover:border-[#C8102E]"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {color}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <motion.button
                onClick={handleAddToCart}
                className="flex-1 premium-button-primary text-lg py-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add to Cart
              </motion.button>
              <motion.button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`px-6 py-4 rounded-lg border-2 transition ${
                  isWishlisted
                    ? "border-[#C8102E] bg-[#C8102E] text-white"
                    : "border-gray-700 text-white hover:border-[#C8102E]"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
              </motion.button>
              <motion.button
                className="px-6 py-4 rounded-lg border-2 border-gray-700 text-white hover:border-[#C8102E] transition"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 size={20} />
              </motion.button>
            </div>

            {/* Benefits */}
            <div className="space-y-3 border-t border-gray-800 pt-8">
              <div className="flex items-center gap-3 text-gray-300">
                <Truck size={20} className="text-[#C8102E]" />
                <span>Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <RotateCcw size={20} className="text-[#C8102E]" />
                <span>30-day free returns</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <ShieldCheck size={20} className="text-[#C8102E]" />
                <span>Authentic guaranteed</span>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                Estimated delivery: <span className="text-white font-semibold">2-4 business days</span>
              </div>
            </div>

            {/* Seller Info */}
            <div className="mt-8 p-4 bg-[#1a1a1f] rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Sold by</p>
              <p className="font-semibold">{product.sellerName}</p>
            </div>

            {/* Feedback */}
            <div className="mt-8 rounded-lg border border-slate-700 bg-[#121218] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Customer feedback</p>
                  <p className="text-2xl font-bold text-white">
                    {feedbackSummary ? feedbackSummary.avg_rating.toFixed(1) : "0.0"}
                    <span className="ml-2 text-sm font-medium text-slate-400">
                      ({feedbackSummary?.count ?? 0} ratings)
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      {star <= Math.round(feedbackSummary?.avg_rating || 0) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitFeedback} className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor="feedback-rating" className="text-sm text-slate-300">
                    Your rating
                  </label>
                  <select
                    id="feedback-rating"
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(Number.parseInt(e.target.value, 10))}
                    className="rounded-md border border-slate-600 bg-[#0f1118] px-3 py-1.5 text-sm text-white focus:border-[#C8102E] focus:outline-none"
                    disabled={!isLoggedIn || feedbackSubmitting}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} Star{value > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder={isLoggedIn ? "Share your experience with this product" : "Login to write feedback"}
                  className="w-full min-h-[92px] rounded-md border border-slate-600 bg-[#0f1118] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#C8102E] focus:outline-none"
                  disabled={!isLoggedIn || feedbackSubmitting}
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    {isLoggedIn ? "Your feedback helps improve recommendations." : "Please login to submit feedback."}
                  </p>
                  <button
                    type="submit"
                    className="rounded-md bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!isLoggedIn || feedbackSubmitting}
                  >
                    {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </div>
              </form>

              {feedbackSuccess && <p className="mt-3 text-sm text-emerald-400">{feedbackSuccess}</p>}
              {feedbackError && <p className="mt-3 text-sm text-rose-400">{feedbackError}</p>}

              <div className="mt-5 space-y-3">
                <p className="text-sm font-semibold text-slate-200">Recent feedback</p>
                {feedbackLoading && <p className="text-sm text-slate-400">Loading feedback...</p>}
                {!feedbackLoading && feedbackList.length === 0 && (
                  <p className="text-sm text-slate-400">No feedback yet for this product.</p>
                )}
                {!feedbackLoading && feedbackList.map((item) => (
                  <div key={item.id} className="rounded-md border border-slate-700 bg-[#0f1118] px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-yellow-400">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</p>
                      <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-200">{item.comment || "No comment"}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-32"
        >
          <h2 className="text-3xl font-bold mb-8">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.filter((p) => p.category === product.category && p.id !== id)
              .slice(0, 4)
              .map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  whileHover={{ y: -8 }}
                >
                  <div className="relative bg-[#1a1a1f] rounded-lg overflow-hidden mb-3">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full aspect-square object-cover group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <h3 className="font-semibold truncate group-hover:text-[#C8102E] transition">{relatedProduct.name}</h3>
                  <p className="text-[#C8102E] font-bold">${relatedProduct.price}</p>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-[#0b0f1a]/95 backdrop-blur p-3 lg:hidden">
        <div className="mx-auto max-w-7xl flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-lg font-bold text-white truncate">${product.price}</p>
          </div>
          <button
            onClick={handleAddToCart}
            className="ml-auto premium-button-primary py-2 px-5"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
