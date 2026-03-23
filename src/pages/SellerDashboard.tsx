import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Plus, LogOut } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../hooks/useContext";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { products, addProduct } = useProducts();

  const [showAddProduct, setShowAddProduct] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    description: "",
    category: "",
    stock: "",
  });

  if (!user || user.role !== "seller") {
    return (
      <div className="bg-[#0B0B0D] text-white min-h-screen flex items-center justify-center">
        <button onClick={() => navigate("/login")} className="premium-button-primary">
          Login as Seller
        </button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.image) {
      alert("Please fill all required fields");
      return;
    }

    const newProduct = {
      id: Date.now().toString(),
      name: form.name,
      price: Number(form.price),
      image: form.image,
      description: form.description,
      category: form.category || "general",
      stock: Number(form.stock) || 0,
      rating: 4,

      reviews: 0,
    sellerId: user.id,
    sellerName: user.name,
    inStock: Number(form.stock) > 0,
    };

    try {
      await addProduct(newProduct);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product";
      alert(message);
      return;
    }

    setForm({
      name: "",
      price: "",
      image: "",
      description: "",
      category: "",
      stock: "",
    });

    setShowAddProduct(false);
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
            <span className="text-[#C8102E] text-sm font-bold uppercase tracking-widest">
              Dashboard
            </span>
            <h1 className="text-5xl font-black mt-2">Seller Hub</h1>
            <p className="text-gray-400 mt-2">Welcome, {user.name}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Products</p>
            <p className="text-3xl font-bold mt-2">{products.length}</p>
          </div>

          <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Categories</p>
            <p className="text-3xl font-bold mt-2">
              {new Set(products.map((p) => p.category)).size}
            </p>
          </div>

          <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-3xl font-bold mt-2">
              ${products.reduce((sum, p) => sum + p.price, 0)}
            </p>
          </div>
        </div>

        {/* Products Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Products</h2>

            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="flex items-center gap-2 premium-button-primary"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          {/* Add Product Form */}
          {showAddProduct && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6 mb-6 space-y-3"
            >
              <input
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-gray-700 px-3 py-2 rounded"
              />

              <input
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-gray-700 px-3 py-2 rounded"
              />

              <input
                placeholder="Image URL"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-gray-700 px-3 py-2 rounded"
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-gray-700 px-3 py-2 rounded"
              >
                <option value="">Select Category</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              <input
                placeholder="Stock Quantity"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-gray-700 px-3 py-2 rounded"
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full bg-[#0B0B0D] border border-gray-700 px-3 py-2 rounded"
              />

              <button className="w-full bg-[#C8102E] py-2 rounded">
                Save Product
              </button>
            </motion.form>
          )}

          {/* Product List */}
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-4 flex items-center gap-4"
              >
                <img
                  src={product.image}
                  className="w-16 h-16 object-cover rounded"
                  alt={product.name}
                  onError={(e) => {
                    const fallback = `https://picsum.photos/seed/${encodeURIComponent(product.name)}/900/900`;
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />

                <div className="flex-1">
                  <h3>{product.name}</h3>
                  <p className="text-gray-400 text-sm">${product.price}</p>
                  <p className="text-gray-500 text-xs">
                    {product.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}