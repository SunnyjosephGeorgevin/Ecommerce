import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await register(name, email, password, role);
      if (result.pendingApproval) {
        alert("Buyer account created. Please wait for admin approval before login.");
      } else {
        alert("Seller account created successfully. You can now login.");
      }
      navigate("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0B0D] via-[#1a1a1f] to-[#0B0B0D] flex items-center justify-center px-4">
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-2">CREATE ACCOUNT</h1>
          <p className="text-gray-400">Join AI SHOP as Buyer or Seller</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full bg-[#1a1a1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C8102E] transition"
              required
            />
          </div>

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
              placeholder="Create a password"
              className="w-full bg-[#1a1a1f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#C8102E] transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">Register as</label>
            <div className="space-y-2">
              {[
                { id: "buyer", label: "Buyer", note: "Requires admin approval" },
                { id: "seller", label: "Seller", note: "Activated instantly" },
              ].map((item) => (
                <motion.label
                  key={item.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                    role === item.id
                      ? "border-[#C8102E] bg-[#C8102E]/10"
                      : "border-gray-700 hover:border-[#C8102E]/50"
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.id}
                    checked={role === item.id}
                    onChange={(e) => setRole(e.target.value as "buyer" | "seller")}
                    className="w-4 h-4 accent-[#C8102E]"
                  />
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.note}</p>
                  </div>
                </motion.label>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full premium-button-primary text-lg py-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-8">
          Already have an account? <Link to="/login" className="text-[#C8102E] hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
