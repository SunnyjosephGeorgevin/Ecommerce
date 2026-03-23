import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProducts } from "../context/ProductContext";

type HeroSlide = {
  id: string;
  name: string;
  price: number;
  image: string;
  productId?: string;
};

const heroFallbackProducts: HeroSlide[] = [
  {
    id: "hero-1",
    name: "Nike Air Max 90",
    price: 199,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "hero-2",
    name: "MacBook Pro 16-inch",
    price: 2499,
    image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "hero-3",
    name: "Samsung Galaxy S24 Ultra",
    price: 1299,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "hero-4",
    name: "Apple Watch Series 9",
    price: 400,
    image: "https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Hero() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [activeIndex, setActiveIndex] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1, ease: "easeOut" },
    },
  };

  const heroProducts = useMemo<HeroSlide[]>(() => {
    const curated = products
      .filter((product) => product.inStock && product.image)
      .slice(0, 8)
      .map((product): HeroSlide => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        productId: product.id,
      }));

    return curated.length > 0 ? curated : heroFallbackProducts;
  }, [products]);

  useEffect(() => {
    if (activeIndex >= heroProducts.length) {
      setActiveIndex(0);
    }
  }, [heroProducts.length, activeIndex]);

  useEffect(() => {
    if (heroProducts.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroProducts.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [heroProducts.length]);

  const activeProduct = heroProducts[activeIndex] ?? heroFallbackProducts[0];

  const showNext = () => {
    setActiveIndex((prev) => (prev + 1) % heroProducts.length);
  };

  const showPrev = () => {
    setActiveIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    if (info.offset.x < -60) {
      showNext();
      return;
    }

    if (info.offset.x > 60) {
      showPrev();
    }
  };

  const handleHeroImageClick = () => {
    if (activeProduct.productId) {
      navigate(`/product/${activeProduct.productId}`);
      return;
    }

    navigate("/shop");
  };

  return (
    <section className="relative min-h-[90vh] bg-gradient-to-b from-[#0B0B0D] via-[#1a1a1f] to-[#0B0B0D] overflow-hidden pt-12 pb-16">
      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-[#C8102E] rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{
          y: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 bg-[#C8102E] rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{
          y: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Adjusted Grid: Gave the text side slightly more room and added min-w-0 */}
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center min-w-0">
        
        {/* Left Content */}
        <motion.div
          className="z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <span className="text-[#C8102E] font-semibold tracking-widest text-sm">NEW COLLECTION 2024</span>
          </motion.div>

          {/* Adjusted Heading: Scaled down base sizes, added break-words and adjusted leading */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.1] mt-4 tracking-tight break-words"
          >
            INTRODUCING <br />
            <span className="text-gradient">COLLECTION</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-gray-400 mt-6 max-w-md text-base md:text-lg leading-relaxed">
            Premium streetwear and sneakers built for the modern lifestyle. Discover the perfect blend of style,
            comfort, and exclusivity.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8 flex gap-4">
            <button
              onClick={() => navigate("/shop?category=new-arrivals")}
              className="premium-button-primary"
            >
              Shop Now
            </button>
            <button
              onClick={() => navigate("/shop")}
              className="premium-button-secondary"
            >
              Explore Collection
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-[#C8102E]">500+</p>
              <p className="text-gray-400 text-sm">Premium Products</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#C8102E]">50K+</p>
              <p className="text-gray-400 text-sm">Happy Customers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#C8102E]">24/7</p>
              <p className="text-gray-400 text-sm">Support</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Image */}
        <motion.div variants={imageVariants} initial="hidden" animate="visible" className="relative">
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#C8102E] to-transparent rounded-2xl opacity-20 blur-2xl"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <button
              type="button"
              onClick={handleHeroImageClick}
              className="relative z-10 w-full overflow-hidden rounded-2xl shadow-2xl text-left group"
              aria-label={`Open ${activeProduct.name} details`}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeProduct.id}
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                  className="w-full aspect-[5/6] object-cover cursor-grab active:cursor-grabbing group-hover:scale-[1.01] transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = heroFallbackProducts[0].image;
                  }}
                />
              </AnimatePresence>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 py-4">
                <p className="text-white font-bold text-lg leading-tight truncate">{activeProduct.name}</p>
                <p className="text-[#F4B8C4] font-semibold mt-1">${activeProduct.price}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={showPrev}
              className="absolute top-1/2 left-3 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 border border-white/20 text-white flex items-center justify-center hover:bg-[#C8102E] transition"
              aria-label="Previous product"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute top-1/2 right-3 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 border border-white/20 text-white flex items-center justify-center hover:bg-[#C8102E] transition"
              aria-label="Next product"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {heroProducts.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-8 bg-[#C8102E]" : "w-3 bg-white/35"
                  }`}
                  aria-label={`Show ${item.name}`}
                />
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}