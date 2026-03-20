import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />
      <Hero />
      <ProductGrid />

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-[#0B0B0D] to-[#1a1a1f]">
        <div className="max-w-7xl mx-auto px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-black mb-12 text-center"
          >
            Why Choose SpectraCart
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                description: "Complimentary shipping on orders over $100. Fast delivery to your doorstep.",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                description: "30-day hassle-free return policy. No questions asked.",
              },
              {
                icon: Shield,
                title: "Authentic Guarantee",
                description: "100% authentic products from trusted sellers. Your satisfaction is guaranteed.",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#0B0B0D] border border-gray-800 rounded-lg p-8 text-center hover:border-[#C8102E] transition"
                >
                  <motion.div
                    className="mb-4 inline-block"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Icon className="text-[#C8102E] text-5xl" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#C8102E] to-[#a00a25]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto px-8 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Shop?</h2>
          <p className="text-white text-lg mb-8 opacity-90">
            Discover our exclusive collection of premium sneakers, apparel, and accessories
          </p>
          <motion.button
            onClick={() => navigate("/shop")}
            className="bg-white text-[#C8102E] px-8 py-4 rounded-lg font-black text-lg flex items-center gap-3 mx-auto hover:shadow-2xl transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Shopping
            <ArrowRight size={24} />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0B0D] border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">AI SHOP</h3>
              <p className="text-gray-400 text-sm">Premium e-commerce platform for sneakers, apparel, and accessories.</p>
            </div>
            {[
              { title: "Shop", links: ["New Arrivals", "Sneakers", "Apparel", "Accessories"] },
              { title: "Company", links: ["About Us", "Contact", "Careers", "Blog"] },
              { title: "Support", links: ["Help Center", "FAQs", "Shipping Info", "Returns"] },
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-bold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-400 hover:text-white text-sm transition">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500 text-sm text-center">© 2024 AI SHOP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}