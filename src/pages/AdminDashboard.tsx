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

type StatusEntry = {
  ready?: boolean;
  connected?: boolean;
  [key: string]: string | number | boolean | null | undefined;
};

type SystemStatusResponse = {
  updated_at: string;
  infrastructure: {
    database: {
      connected: boolean;
      engine: string;
      error?: string | null;
    };
    cloud_storage: {
      connected: boolean;
      backend: string;
      detail?: string;
    };
  };
  platform_controls?: {
    maintenance_mode: boolean;
  };
  features: {
    behavior_dataset: StatusEntry;
    recommendation_engine: StatusEntry;
    nlp_chatbot: StatusEntry;
    realtime_pipeline: StatusEntry;
    personalization: StatusEntry;
    catalog_api: StatusEntry;
    feedback_system: StatusEntry;
  };
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);
  const [controlBusy, setControlBusy] = useState<string | null>(null);
  const [controlMessage, setControlMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [usersResponse, ordersResponse, statusResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/admin/system-status`, {
          headers: {
            "X-Admin-Email": user?.email || "",
          },
        }),
      ]);

      if (usersResponse.ok) {
        const usersData: DashboardUser[] = await usersResponse.json();
        setUsers(usersData);
      }

      if (ordersResponse.ok) {
        const ordersData: DashboardOrder[] = await ordersResponse.json();
        setOrders(ordersData);
      }

      if (statusResponse.ok) {
        const statusData: SystemStatusResponse = await statusResponse.json();
        setSystemStatus(statusData);
      } else {
        setSystemStatus(null);
      }
    } catch {
      setUsers([]);
      setOrders([]);
      setSystemStatus(null);
    }
  }, [user?.email]);

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

  const renderStatusPill = (label: string, ok: boolean, detail?: string) => (
    <div className="rounded-lg border border-gray-800 bg-[#0B0B0D] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
          <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-rose-400"}`} />
          {ok ? "Connected" : "Issue"}
        </span>
      </div>
      {detail && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{detail}</p>}
    </div>
  );

  const renderFeaturePill = (label: string, payload: StatusEntry | undefined) => {
    const rawOk = payload?.ready ?? payload?.connected;
    const ok = rawOk === undefined ? false : Boolean(rawOk);
    const detailParts = Object.entries(payload ?? {})
      .filter(([key]) => key !== "ready" && key !== "connected")
      .slice(0, 3)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`);
    return renderStatusPill(label, ok, detailParts.join(" • "));
  };

  const callAdminControl = async (path: string, method: "GET" | "POST" = "POST") => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "X-Admin-Email": user?.email || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Control operation failed");
    }

    return response.json();
  };

  const handleMaintenanceMode = async () => {
    setControlBusy("maintenance");
    setControlMessage(null);
    try {
      const result = await callAdminControl("/admin/maintenance-mode/toggle");
      setControlMessage(result.maintenance_mode ? "Maintenance mode enabled" : "Maintenance mode disabled");
      await fetchDashboardData();
    } catch (error) {
      setControlMessage(error instanceof Error ? error.message : "Failed to toggle maintenance mode");
    } finally {
      setControlBusy(null);
    }
  };

  const handleClearAnalytics = async () => {
    const confirmed = window.confirm("This will delete tracked behavior analytics events. Continue?");
    if (!confirmed) {
      return;
    }

    setControlBusy("analytics");
    setControlMessage(null);
    try {
      const result = await callAdminControl("/admin/analytics/clear");
      setControlMessage(`Cleared ${result.deleted_events ?? 0} analytics events`);
      await fetchDashboardData();
    } catch (error) {
      setControlMessage(error instanceof Error ? error.message : "Failed to clear analytics");
    } finally {
      setControlBusy(null);
    }
  };

  const handleGenerateReport = async () => {
    setControlBusy("report");
    setControlMessage(null);
    try {
      const result = await callAdminControl("/admin/reports/generate");
      setControlMessage(`Report generated: ${result.object_name}`);
    } catch (error) {
      setControlMessage(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setControlBusy(null);
    }
  };

  const handleSystemSettings = async () => {
    setControlBusy("settings");
    setControlMessage(null);
    try {
      const result = await callAdminControl("/admin/settings", "GET");
      setControlMessage(
        `Settings loaded: DB ${result.database_engine}, Storage ${result.storage_backend}, Maintenance ${result.maintenance_mode ? "ON" : "OFF"}`
      );
    } catch (error) {
      setControlMessage(error instanceof Error ? error.message : "Failed to load system settings");
    } finally {
      setControlBusy(null);
    }
  };

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

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-lg border border-gray-800 bg-[#1a1a1f] p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">System Health & Feature Visibility</h2>
            <p className="text-xs text-slate-400">
              Last update: {systemStatus ? new Date(systemStatus.updated_at).toLocaleString() : "Unavailable"}
            </p>
          </div>

          {!systemStatus && (
            <p className="text-sm text-rose-300">Unable to fetch live system status. Check admin auth/API availability.</p>
          )}

          {systemStatus && (
            <>
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Infrastructure</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderStatusPill(
                    `Database (${systemStatus.infrastructure.database.engine})`,
                    systemStatus.infrastructure.database.connected,
                    systemStatus.infrastructure.database.error || "Database connection healthy"
                  )}
                  {renderStatusPill(
                    `Cloud Storage (${systemStatus.infrastructure.cloud_storage.backend})`,
                    systemStatus.infrastructure.cloud_storage.connected,
                    systemStatus.infrastructure.cloud_storage.detail
                  )}
                  {renderStatusPill(
                    "Maintenance Mode",
                    !Boolean(systemStatus.platform_controls?.maintenance_mode),
                    systemStatus.platform_controls?.maintenance_mode ? "Platform is currently in maintenance mode" : "Platform is in normal operation mode"
                  )}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Requirement Satisfaction</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {renderFeaturePill("User Behavior Dataset", systemStatus.features.behavior_dataset)}
                  {renderFeaturePill("Recommendation Engine", systemStatus.features.recommendation_engine)}
                  {renderFeaturePill("NLP Chatbot", systemStatus.features.nlp_chatbot)}
                  {renderFeaturePill("Realtime Pipeline", systemStatus.features.realtime_pipeline)}
                  {renderFeaturePill("Personalization", systemStatus.features.personalization)}
                  {renderFeaturePill("Product Catalog API", systemStatus.features.catalog_api)}
                  {renderFeaturePill("Feedback System", systemStatus.features.feedback_system)}
                  {renderStatusPill("Cloud Storage", systemStatus.infrastructure.cloud_storage.connected, systemStatus.infrastructure.cloud_storage.detail)}
                  {renderStatusPill("Web Assistant UI", true, "Chatbot and personalized sections are enabled in web UI")}
                </div>
              </div>
            </>
          )}
        </motion.div>

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
          {controlMessage && (
            <p className="mb-4 rounded-lg border border-slate-700 bg-[#0B0B0D] px-3 py-2 text-sm text-slate-200">{controlMessage}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                key: "maintenance",
                label: systemStatus?.platform_controls?.maintenance_mode ? "Disable Maintenance" : "Maintenance Mode",
                color: "bg-yellow-600",
                onClick: handleMaintenanceMode,
              },
              {
                key: "analytics",
                label: "Clear Analytics",
                color: "bg-gray-600",
                onClick: handleClearAnalytics,
              },
              {
                key: "report",
                label: "Generate Report",
                color: "bg-blue-600",
                onClick: handleGenerateReport,
              },
              {
                key: "settings",
                label: "System Settings",
                color: "bg-purple-600",
                onClick: handleSystemSettings,
              },
            ].map((control) => (
              <motion.button
                key={control.key}
                onClick={control.onClick}
                disabled={Boolean(controlBusy)}
                className={`${control.color} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition px-4 py-3 rounded-lg font-semibold text-sm`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {controlBusy === control.key ? "Working..." : control.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
