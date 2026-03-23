import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Share2, Truck, RotateCcw, ShieldCheck, ChevronLeft } from "lucide-react";
import { useCart } from "../hooks/useContext";
import { useProducts } from "../context/ProductContext";
import { SIZE_BASED_CATEGORIES } from "../constants/categories";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");

  const product = products.find((p) => p.id === id);

  useEffect(() => {
    if (!product || typeof window === "undefined") {
      return;
    }
    const recent = localStorage.getItem("recentlyViewedProducts");
    const parsed: string[] = recent ? JSON.parse(recent) : [];
    const updated = [product.id, ...parsed.filter((item) => item !== product.id)].slice(0, 12);
    localStorage.setItem("recentlyViewedProducts", JSON.stringify(updated));
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
