import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Package, ShoppingCart, TrendingUp, LogOut, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useContext";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import { API_BASE_URL } from "../config/api";

type DashboardUser = {
  id: number;
  name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  is_approved: boolean;
};

type DashboardOrder = {
  id: number;
  total: number;
  items_count: number;
  status: string;
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [usersResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/orders`),
      ]);

      if (usersResponse.ok) {
        const usersData: DashboardUser[] = await usersResponse.json();
        setUsers(usersData);
      }

      if (ordersResponse.ok) {
        const ordersData: DashboardOrder[] = await ordersResponse.json();
        setOrders(ordersData);
      }
    } catch {
      setUsers([]);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const pollId = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => {
      clearInterval(pollId);
    };
  }, [fetchDashboardData]);

  const buyers = useMemo(() => users.filter((item) => item.role === "buyer"), [users]);
  const sellers = useMemo(() => users.filter((item) => item.role === "seller"), [users]);

  const approveBuyer = async (buyerId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${buyerId}/approve`, {
        method: "POST",
        headers: {
          "X-Admin-Email": user?.email || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve buyer");
      }

      await fetchDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approval failed";
      alert(message);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="bg-[#0B0B0D] text-white min-h-screen flex items-center justify-center">
        <button onClick={() => navigate("/login")} className="premium-button-primary">
          Login as Admin
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const totalUsers = users.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-12"
        >
          <div>
            <span className="text-[#C8102E] text-sm font-bold uppercase tracking-widest">Administration</span>
            <h1 className="text-5xl md:text-6xl font-black mt-2">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">Platform Management & Analytics</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-500" },
            { label: "Total Products", value: products.length, icon: Package, color: "text-green-500" },
            { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-yellow-500" },
            { label: "Total Revenue", value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: "text-[#C8102E]" },
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6 hover:border-[#C8102E]/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{metric.label}</p>
                    <p className="text-3xl font-bold mt-2">{metric.value}</p>
                  </div>
                  <Icon className={`${metric.color} text-4xl opacity-50`} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* All Products */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">All Products</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-[#0B0B0D] rounded hover:bg-[#1a1a1f] transition"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-gray-400 text-xs">${product.price} • {product.category}</p>
                  </div>
                  <button className="text-red-500 hover:text-red-700 transition p-1">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* All Orders */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="flex justify-between items-center p-3 bg-[#0B0B0D] rounded hover:bg-[#1a1a1f] transition"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{order.id}</p>
                    <p className="text-gray-400 text-xs">${order.total} • {order.items_count} items</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      order.status === "pending"
                        ? "bg-yellow-600"
                        : order.status === "confirmed"
                        ? "bg-blue-600"
                        : order.status === "delivered"
                        ? "bg-green-600"
                        : "bg-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* All Buyers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">All Buyers</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {buyers.map((buyer) => (
                <motion.div
                  key={buyer.id}
                  className="flex justify-between items-center p-3 bg-[#0B0B0D] rounded hover:bg-[#1a1a1f] transition"
                  whileHover={{ x: 4 }}
                >
                  <div>
                    <p className="font-semibold text-sm">{buyer.name}</p>
                    <p className="text-gray-400 text-xs">{buyer.email}</p>
                  </div>
                  {buyer.is_approved ? (
                    <span className="text-[#C8102E] font-semibold text-sm">Approved</span>
                  ) : (
                    <button
                      onClick={() => approveBuyer(buyer.id)}
                      className="text-xs px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-500 font-semibold"
                    >
                      Approve
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* All Sellers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4">All Sellers</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sellers.map((seller) => (
                <motion.div
                  key={seller.id}
                  className="flex justify-between items-center p-3 bg-[#0B0B0D] rounded hover:bg-[#1a1a1f] transition"
                  whileHover={{ x: 4 }}
                >
                  <div>
                    <p className="font-semibold text-sm">{seller.name}</p>
                    <p className="text-gray-400 text-xs">{seller.email}</p>
                  </div>
                  <span className="text-green-500 font-semibold text-sm">Seller</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Platform Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-[#1a1a1f] border border-gray-800 rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Platform Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Maintenance Mode", color: "bg-yellow-600" },
              { label: "Clear Analytics", color: "bg-gray-600" },
              { label: "Generate Report", color: "bg-blue-600" },
              { label: "System Settings", color: "bg-purple-600" },
            ].map((control, i) => (
              <motion.button
                key={i}
                className={`${control.color} hover:opacity-80 transition px-4 py-3 rounded-lg font-semibold text-sm`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {control.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
