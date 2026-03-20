import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();

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
            <img
              src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=700&fit=crop"
              alt="Premium Sneaker"
              className="w-full rounded-2xl shadow-2xl relative z-10"
            />
          </div>

          {/* Floating cards */}
          <motion.div
            className="absolute -bottom-6 -left-2 sm:-left-6 bg-white text-black p-4 rounded-lg shadow-lg z-20"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <p className="font-bold text-lg">Free Shipping</p>
            <p className="text-sm text-gray-600">On orders over $100</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 tracking-widest">SCROLL TO EXPLORE</span>
          <div className="w-6 h-10 border-2 border-[#C8102E] rounded-full flex justify-center">
            <motion.div
              className="w-1 h-2 bg-[#C8102E] rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}