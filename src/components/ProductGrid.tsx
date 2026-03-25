import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductContext";
import { ProductCategory, ProductFilters } from "../types";
import { Filter, Star, X } from "lucide-react";
import { PRODUCT_CATEGORIES } from "../constants/categories";
import { trackBehaviorEvent } from "../services/behavior";

const mapUiCategoryToDbCategories = (category?: ProductCategory): string[] => {
  if (!category) return [];
  if (category === "footwear") return ["footwear", "sneakers"];
  if (category === "fashion") return ["fashion", "apparel"];
  return [category];
};

const GRID_CATEGORY_COPY: Record<string, string> = {
  laptop: "Premium laptops for productivity, gaming, and creator workflows.",
  mobile: "Top mobile picks across flagship, mid-range, and budget segments.",
  fashion: "Curated fashion essentials and statement pieces for every style.",
  footwear: "Comfort-driven footwear and sneakers for daily wear and performance.",
  sneakers: "Street-ready and sport-inspired sneakers from leading brands.",
  apparel: "Everyday apparel and performance wear tailored for comfort.",
  accessories: "Watches, bags, eyewear, and essentials to complete your look.",
  "new-arrivals": "Fresh arrivals handpicked from the latest collection.",
};

const GRID_CATEGORY_TITLES: Record<string, string> = {
  laptop: "Laptops Collection",
  mobile: "Mobile Collection",
  fashion: "Fashion Collection",
  footwear: "Footwear Collection",
  sneakers: "Sneakers Collection",
  apparel: "Apparel Collection",
  accessories: "Accessories Collection",
  "new-arrivals": "New Arrivals",
};

type ProductGridProps = {
  initialCategory?: string;
};

type SortOption = "best" | "price-asc" | "price-desc" | "new" | "rating";

export default function ProductGrid({ initialCategory }: ProductGridProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    priceRange: [0, 100000],
    category: (initialCategory as ProductCategory | undefined) ?? undefined,
    search: "",
  });

  const categories: ProductCategory[] = [...PRODUCT_CATEGORIES];
  const priceRanges = [
    { label: "Under $100", value: [0, 100] },
    { label: "$100 - $200", value: [100, 200] },
    { label: "$200 - $300", value: [200, 300] },
    { label: "Over $300", value: [300, 500] },
  ];
  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Best Match", value: "best" },
    { label: "Price Low-High", value: "price-asc" },
    { label: "Price High-Low", value: "price-desc" },
    { label: "Newest", value: "new" },
    { label: "Top Rated", value: "rating" },
  ];

  const { products, loading, error, fetchProducts } = useProducts();
  const lastTrackedFilterSignature = useRef<string>("");

  const brandOptions = useMemo(() => {
    const brandSet = new Set<string>();
    products.forEach((product) => {
      const brand = product.name.split(" ")[0]?.trim();
      if (brand) brandSet.add(brand);
    });
    return Array.from(brandSet).sort().slice(0, 10);
  }, [products]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: (initialCategory as ProductCategory | undefined) ?? undefined,
    }));
  }, [initialCategory]);

  const filteredProducts = useMemo(() => {
    const mappedCategories = mapUiCategoryToDbCategories(filters.category);
    const baseProducts = products.filter((product) => {
      const matchesCategory = mappedCategories.length === 0 || mappedCategories.includes(product.category);
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const matchesRating = product.rating >= minRating;
      const matchesStock = !inStockOnly || (product.stock ?? 0) > 0;
      const isOnSale = Boolean(product.originalPrice && product.originalPrice > product.price);
      const matchesSale = !onSaleOnly || isOnSale;
      const productBrand = product.name.split(" ")[0]?.trim() ?? "";
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(productBrand);
      return matchesCategory && matchesPrice && matchesRating && matchesStock && matchesSale && matchesBrand;
    });

    const sortList = (list: typeof baseProducts) => {
      if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price);
      if (sortBy === "price-desc") return [...list].sort((a, b) => b.price - a.price);
      if (sortBy === "rating") return [...list].sort((a, b) => b.rating - a.rating);
      if (sortBy === "new") return [...list].reverse();
      return list;
    };

    const searchTerm = filters.search?.trim().toLowerCase();
    if (!searchTerm) return sortList(baseProducts);

    const nameMatches = baseProducts.filter((product) => product.name.toLowerCase().includes(searchTerm));
    if (nameMatches.length > 0) {
      const firstMatch = nameMatches[0];
      const sameCategoryProducts = baseProducts.filter(
        (product) => product.category === firstMatch.category && product.id !== firstMatch.id
      );
      return sortList([firstMatch, ...sameCategoryProducts]);
    }

    return sortList(baseProducts.filter((product) => product.category.toLowerCase().includes(searchTerm)));
  }, [filters, products, inStockOnly, minRating, onSaleOnly, selectedBrands, sortBy]);

  const selectedCategory = filters.category ?? (initialCategory as ProductCategory | undefined);
  const sectionTitle = (selectedCategory && GRID_CATEGORY_TITLES[selectedCategory]) || "Featured Products";
  const sectionDescription =
    (selectedCategory && GRID_CATEGORY_COPY[selectedCategory]) ||
    "Discover our curated collection of premium products from leading brands.";

  const handleCategoryFilter = (category: ProductCategory) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const resetFilters = () => {
    setFilters({ priceRange: [0, 100000], category: undefined, search: "" });
    setSelectedBrands([]);
    setMinRating(0);
    setInStockOnly(true);
    setOnSaleOnly(false);
    setSortBy("best");
  };

  const removeFilterPill = (type: "category" | "search" | "stock" | "sale" | "rating" | "brand", value?: string) => {
    if (type === "category") setFilters((prev) => ({ ...prev, category: undefined }));
    if (type === "search") setFilters((prev) => ({ ...prev, search: "" }));
    if (type === "stock") setInStockOnly(false);
    if (type === "sale") setOnSaleOnly(false);
    if (type === "rating") setMinRating(0);
    if (type === "brand" && value) setSelectedBrands((prev) => prev.filter((b) => b !== value));
  };

  useEffect(() => {
    const filterSignature = JSON.stringify({
      category: filters.category ?? "all",
      search: filters.search?.trim().toLowerCase() || "",
      price: filters.priceRange,
      sortBy,
      inStockOnly,
      onSaleOnly,
      minRating,
      selectedBrands: [...selectedBrands].sort(),
      resultCount: filteredProducts.length,
    });

    if (filterSignature === lastTrackedFilterSignature.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastTrackedFilterSignature.current = filterSignature;
      void trackBehaviorEvent({
        action: "search",
        query: `shop:${filterSignature}`,
        score: 0.8,
        context: {
          source: "shop-grid",
          visible_results: filteredProducts.length,
        },
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [filters, filteredProducts.length, inStockOnly, minRating, onSaleOnly, selectedBrands, sortBy]);

  const renderFilterPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
      <div>
        <h4 className="font-semibold mb-4">Price Range</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label key={range.label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price"
                checked={filters.priceRange[0] === range.value[0] && filters.priceRange[1] === range.value[1]}
                onChange={() => setFilters((prev) => ({ ...prev, priceRange: range.value as [number, number] }))}
                className="w-4 h-4 accent-[#C8102E]"
              />
              <span className="text-sm">{range.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Quality</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 accent-[#C8102E]" />
            <span className="text-sm">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} className="w-4 h-4 accent-[#C8102E]" />
            <span className="text-sm">On Sale</span>
          </label>
          <div>
            <p className="text-sm mb-2">Minimum Rating</p>
            <div className="flex gap-2">
              {[0, 3, 4].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setMinRating(rating)}
                  className={`rounded-lg px-3 py-1.5 text-xs border transition ${minRating === rating ? "border-rose-500 bg-rose-500/10 text-rose-200" : "border-slate-700 text-slate-300 hover:border-rose-500/60"}`}
                >
                  {rating === 0 ? "Any" : `${rating}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-4">Brand</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {brandOptions.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={(e) => {
                  setSelectedBrands((prev) => (e.target.checked ? [...prev, brand] : prev.filter((b) => b !== brand)));
                }}
                className="w-4 h-4 accent-[#C8102E]"
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen bg-[#0B0B0D] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{sectionTitle}</h2>
          <p className="text-slate-300 max-w-2xl text-base md:text-lg">{sectionDescription}</p>
        </motion.div>

        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="flex-1 min-w-[220px] rounded-xl border border-slate-700 bg-[#121725] px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-[#C8102E]"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#121725] px-4 py-3 hover:border-[#C8102E] transition"
            aria-expanded={showFilters}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
          <div className="ml-auto text-slate-300 text-sm font-medium pr-1" role="status" aria-live="polite">
            {filteredProducts.length} products found
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs border transition ${sortBy === option.value ? "border-rose-500 bg-rose-500/12 text-rose-200" : "border-slate-700 text-slate-300 hover:border-rose-500/60"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.category && (
            <button onClick={() => removeFilterPill("category")} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
              Category: {filters.category} <span className="ml-1 text-rose-300">x</span>
            </button>
          )}
          {filters.search && (
            <button onClick={() => removeFilterPill("search")} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
              Search: {filters.search} <span className="ml-1 text-rose-300">x</span>
            </button>
          )}
          {inStockOnly && (
            <button onClick={() => removeFilterPill("stock")} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
              In Stock <span className="ml-1 text-rose-300">x</span>
            </button>
          )}
          {onSaleOnly && (
            <button onClick={() => removeFilterPill("sale")} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
              On Sale <span className="ml-1 text-rose-300">x</span>
            </button>
          )}
          {minRating > 0 && (
            <button onClick={() => removeFilterPill("rating")} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 inline-flex items-center gap-1">
              <Star size={12} className="text-amber-400" /> {minRating}+ <span className="text-rose-300">x</span>
            </button>
          )}
          {selectedBrands.map((brand) => (
            <button key={brand} onClick={() => removeFilterPill("brand", brand)} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200">
              {brand} <span className="ml-1 text-rose-300">x</span>
            </button>
          ))}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-8 hidden md:block rounded-2xl border border-slate-700 bg-[#131827] p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <div className="flex gap-2">
                <button onClick={resetFilters} className="text-xs px-3 py-1 rounded bg-slate-700 hover:bg-[#C8102E] transition">
                  Reset
                </button>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white" aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
            </div>
            {renderFilterPanel()}
          </motion.div>
        )}

        {showFilters && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-[#121827] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="rounded-lg p-1 text-slate-300 hover:text-white" aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
              {renderFilterPanel()}
              <div className="mt-6 flex gap-3">
                <button onClick={resetFilters} className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm text-slate-200">Reset</button>
                <button onClick={() => setShowFilters(false)} className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 py-2.5 text-sm font-semibold">Apply</button>
              </div>
            </motion.div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="status" aria-live="polite">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 animate-pulse">
                <div className="aspect-square rounded-xl bg-slate-800 mb-4" />
                <div className="h-4 rounded bg-slate-800 mb-2" />
                <div className="h-4 w-2/3 rounded bg-slate-800 mb-4" />
                <div className="h-6 w-1/2 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 rounded-2xl border border-rose-700/40 bg-gradient-to-b from-rose-950/25 to-[#0b0b0d]">
            <p className="text-rose-200 text-xl font-semibold">Could not load products right now</p>
            <p className="text-slate-300 mt-2">{error}</p>
            <button
              onClick={() => {
                void fetchProducts(filters.category);
              }}
              className="mt-6 premium-button-primary"
            >
              Retry
            </button>
          </motion.div>
        ) : filteredProducts.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <ProductCard {...product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-[#0b0b0d]">
            <p className="text-slate-200 text-xl font-semibold">No products match these filters</p>
            <p className="text-slate-400 mt-2">Try removing a few filters or explore popular categories below.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {["laptop", "mobile", "sneakers", "accessories"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilters((prev) => ({ ...prev, category: cat as ProductCategory, search: "" }))}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-rose-500/70"
                >
                  {cat}
                </button>
              ))}
            </div>
            <button onClick={resetFilters} className="mt-6 premium-button-primary">
              Clear All Filters
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}