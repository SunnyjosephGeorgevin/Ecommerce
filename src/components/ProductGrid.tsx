import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductContext";
import { ProductCategory, ProductFilters } from "../types";
import { Filter, X } from "lucide-react";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export default function ProductGrid() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    priceRange: [0, 100000],
    category: undefined,
    search: "",
  });

  const categories: ProductCategory[] = [...PRODUCT_CATEGORIES];
  const priceRanges = [
    { label: "Under $100", value: [0, 100] },
    { label: "$100 - $200", value: [100, 200] },
    { label: "$200 - $300", value: [200, 300] },
    { label: "Over $300", value: [300, 500] },
  ];

  const { products } = useProducts();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const matchesSearch =
        !filters.search || product.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchesCategory && matchesPrice && matchesSearch;
    });
  }, [filters, products]);

  const handleCategoryFilter = (category: ProductCategory) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 100000],
      category: undefined,
      search: "",
    });
  };

  return (
    <section className="min-h-screen bg-[#0B0B0D] py-20">
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-12">
          <h2 className="text-5xl font-bold mb-4">Featured Products</h2>
          <p className="text-gray-400 max-w-2xl">
            Discover our curated collection of premium sneakers, apparel, and accessories from leading brands.
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="flex-1 min-w-[200px] bg-[#1a1a1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C8102E]"
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-[#1a1a1f] border border-gray-700 rounded-lg px-4 py-3 hover:border-[#C8102E] transition"
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>

          <div className="text-gray-400 text-sm">
            {filteredProducts.length} products found
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8 bg-[#1a1a1f] border border-gray-700 rounded-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="text-xs px-3 py-1 bg-gray-700 rounded hover:bg-[#C8102E] transition"
                >
                  Reset
                </button>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Category Filter */}
              <div>
                <h4 className="font-semibold mb-4">Category</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.category === cat}
                        onChange={() => handleCategoryFilter(cat)}
                        className="w-4 h-4 rounded accent-[#C8102E]"
                      />
                      <span className="capitalize text-sm">{cat.replace(/-/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h4 className="font-semibold mb-4">Price Range</h4>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={
                          filters.priceRange[0] === range.value[0] &&
                          filters.priceRange[1] === range.value[1]
                        }
                        onChange={() => setFilters((prev) => ({ ...prev, priceRange: range.value as [number, number] }))}
                        className="w-4 h-4 accent-[#C8102E]"
                      />
                      <span className="text-sm">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <h4 className="font-semibold mb-4">Availability</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#C8102E]" />
                    <span className="text-sm">In Stock Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#C8102E]" />
                    <span className="text-sm">On Sale</span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-400 text-lg">No products found matching your criteria.</p>
            <button
              onClick={resetFilters}
              className="mt-4 premium-button-primary"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}