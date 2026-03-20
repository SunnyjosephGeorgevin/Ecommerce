import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Product } from "../types";
import { useCart } from "../hooks/useContext";
import { useNavigate } from "react-router-dom";

interface Props extends Product {}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  rating,
  reviews,
  stock,
}: Props) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const discountPercent = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

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
  };

  return (
    <motion.div
      className="group"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="relative bg-[#1a1a1f] rounded-xl overflow-hidden cursor-pointer border border-gray-800 hover:border-[#C8102E] transition">
        {/* Image Container */}
        <div
          className="relative w-full aspect-square overflow-hidden bg-gray-900"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-3 left-3 bg-[#C8102E] text-white px-2 py-1 rounded-md text-xs font-bold">
              -{discountPercent}%
            </div>
          )}

          {/* Stock Badge */}
          <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-md text-xs font-bold">
            In Stock
          </div>

          {/* Wishlist Button */}
          <motion.button
            className="absolute bottom-3 left-3 bg-white text-black p-2 rounded-full shadow-lg hover:bg-[#C8102E] hover:text-white transition"
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
            className="absolute bottom-3 right-3 bg-[#C8102E] text-white p-2 rounded-full shadow-lg hover:bg-white hover:text-black transition"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} />
          </motion.button>
        </div>

        {/* Product Info */}
        <div className="p-4 bg-[#0B0B0D]">
          <h3 className="text-base font-semibold group-hover:text-[#C8102E] transition line-clamp-2">{name}</h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.floor(rating) ? "text-yellow-500" : "text-gray-600"}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400">({reviews})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 mt-3">
            <p className="text-lg font-bold text-white">${price}</p>
            {originalPrice && (
              <p className="text-sm text-gray-500 line-through">${originalPrice}</p>
            )}
          </div>

          {/* Category Tag */}
          <div className="mt-3 inline-block">
            <span className="text-xs px-3 py-1 bg-[#C8102E] text-white rounded-full font-semibold uppercase tracking-wide">
              {category}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}