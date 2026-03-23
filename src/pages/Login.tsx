import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useContext";
import { useProducts } from "../context/ProductContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { fetchProducts } = useProducts();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      await fetchProducts();
      if (loggedInUser.role === "seller") {
        navigate("/seller");
      } else if (loggedInUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0B0D] via-[#1a1a1f] to-[#0B0B0D] flex items-center justify-center px-4">
      {/* Background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-[#C8102E] rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 bg-[#C8102E] rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-2">SpectraCart</h1>
          <p className="text-gray-400">Premium E-Commerce Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-[#1a1a1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C8102E] transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#1a1a1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C8102E] transition"
              required
            />
          </div>

          {/* Quick Login Suggestions */}
          <div className="bg-[#1a1a1f] border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Demo accounts (password: demo-password-123):</p>
            <div className="space-y-1 text-xs">
              <p className="text-gray-500">
                <span className="font-semibold">Buyer:</span> buyer@demo.com
              </p>
              <p className="text-gray-500">
                <span className="font-semibold">Seller:</span> seller@demo.com
              </p>
              <p className="text-gray-500">
                <span className="font-semibold">Admin:</span> admin@demo.com
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full premium-button-primary text-lg py-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          Need an account? <Link to="/register" className="text-[#C8102E] hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
