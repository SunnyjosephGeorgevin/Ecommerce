import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />
      
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-[#1a1a1f] to-[#0B0B0D] py-16 border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-8">
          <span className="text-[#C8102E] text-sm font-bold uppercase tracking-widest">Shop</span>
          <h1 className="text-5xl md:text-6xl font-black mb-3 mt-2">
            {category
              ? category.replace(/-/g, " ").toUpperCase()
              : "SHOP ALL PRODUCTS"}
          </h1>
          <p className="text-gray-400 text-lg">
            Discover our complete collection of premium products
          </p>
        </div>
      </motion.div>

      <ProductGrid />
    </div>
  );
}
