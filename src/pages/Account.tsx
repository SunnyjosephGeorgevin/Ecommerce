import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Heart, Package, Settings } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

type AccountOrder = {
  id: number;
  user_id: number;
  total: number;
  status: string;
  created_at: string;
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AccountOrder[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) {
          return;
        }

        const allOrders: AccountOrder[] = await response.json();
        const userOrderList = allOrders.filter((item) => String(item.user_id) === user.id);
        setOrders(userOrderList);
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, [user]);

  const orderCount = useMemo(() => orders.length, [orders]);

  if (!user) {
    return (
      <div className="bg-[#0B0B0D] text-white min-h-screen flex items-center justify-center">
        <button onClick={() => navigate("/login")} className="premium-button-primary">
          Login to Your Account
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="text-[#C8102E] text-sm font-bold uppercase tracking-widest">My Account</span>
          <h1 className="text-5xl md:text-6xl font-black mt-2">Your Profile</h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#1a1a1f] to-[#0B0B0D] border border-gray-800 rounded-lg p-8 mb-12"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-[#C8102E] rounded-full flex items-center justify-center text-4xl">
              {user.avatar || "👤"}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black">{user.name}</h1>
              <p className="text-gray-400 mt-2">{user.email}</p>
              <div className="mt-3">
                <span className="inline-block px-3 py-1 bg-[#C8102E] rounded-full text-sm font-semibold">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={18} />
              Logout
            </motion.button>
          </div>
        </motion.div>

        {/* Account Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Package, label: "My Orders", count: orderCount, color: "text-blue-500" },
            { icon: Heart, label: "Wishlist", count: 0, color: "text-red-500" },
            { icon: Settings, label: "Settings", count: user.role.toUpperCase(), color: "text-green-500" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6 text-center hover:border-[#C8102E] cursor-pointer transition"
                whileHover={{ y: -4 }}
              >
                <Icon className={`${item.color} text-4xl mx-auto mb-3`} />
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-2xl font-bold text-[#C8102E]">{item.count}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6">Account Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-700">
              <span className="text-gray-400">Full Name</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-700">
              <span className="text-gray-400">Email</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-700">
              <span className="text-gray-400">Account Type</span>
              <span className="font-semibold capitalize">{user.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member Since</span>
              <span className="font-semibold">March 2024</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <motion.div
                key={order.id}
                className="flex justify-between items-center p-4 bg-[#0B0B0D] rounded hover:bg-[#1a1a1f] transition"
                whileHover={{ x: 4 }}
              >
                <div>
                  <p className="font-semibold">#{order.id}</p>
                  <p className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#C8102E]">${order.total.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${order.status === "delivered" ? "bg-green-600" : "bg-blue-600"}`}>
                    {order.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
