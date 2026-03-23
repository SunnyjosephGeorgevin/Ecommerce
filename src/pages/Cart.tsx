import { motion } from "framer-motion";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../hooks/useContext";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartItem, clearCart, cartTotal } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  const shippingCost = cartTotal > 100 ? 0 : 15;
  const taxCost = Math.round(cartTotal * 0.08 * 100) / 100;
  const finalTotal = cartTotal + shippingCost + taxCost - promoDiscount;

  const applyPromoCode = () => {
    const normalized = promoCode.trim().toUpperCase();
    if (normalized === "SAVE10") {
      const discount = Math.round(cartTotal * 0.1 * 100) / 100;
      setPromoDiscount(discount);
      setPromoMessage(`Applied SAVE10: You saved $${discount.toFixed(2)}`);
      return;
    }
    if (normalized === "FREESHIP") {
      const discount = shippingCost;
      setPromoDiscount(discount);
      setPromoMessage(`Applied FREESHIP: You saved $${discount.toFixed(2)}`);
      return;
    }
    setPromoDiscount(0);
    setPromoMessage("Promo code not recognized. Try SAVE10 or FREESHIP");
  };

  if (cart.items.length === 0) {
    return (
      <div className="bg-[#0B0B0D] text-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-600" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-400 mb-8">Start shopping to add items to your cart</p>
            <button
              onClick={() => navigate("/shop")}
              className="premium-button-primary"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-12"
        >
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-[#C8102E] transition p-2"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <span className="text-[#C8102E] text-sm font-bold uppercase tracking-widest">Checkout</span>
            <h1 className="text-5xl md:text-6xl font-black mt-2">Shopping Cart</h1>
            <p className="text-gray-400 mt-1">You have {cart.items.length} item(s) in your cart</p>
          </div>
        </motion.div>

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="rounded-full bg-rose-500 text-white px-3 py-1 font-semibold">1. Cart</span>
            <span className="text-slate-500">{"->"}</span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">2. Checkout</span>
            <span className="text-slate-500">{"->"}</span>
            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">3. Confirmation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4 bg-[#1a1a1f] border border-gray-800 rounded-lg p-6 hover:border-[#C8102E]/50 transition"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    const fallback = `https://picsum.photos/seed/${encodeURIComponent(item.product.name)}/900/900`;
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{item.product.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{item.product.category}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-[#0B0B0D] rounded-lg p-2">
                      <button
                        onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                        className="text-gray-400 hover:text-white transition p-1"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                        className="text-gray-400 hover:text-white transition p-1"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-[#C8102E] text-xl font-bold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-sm">
                        ${item.product.price} each
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-gray-400 hover:text-red-500 transition ml-4"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6 h-fit sticky top-20"
          >
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-700">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? "text-green-500 font-semibold" : ""}>
                  {shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax (8%)</span>
                <span>${taxCost.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo Discount</span>
                  <span>- ${promoDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-6 text-xl font-bold">
              <span>Total</span>
              <span className="text-[#C8102E]">${finalTotal.toFixed(2)}</span>
            </div>

            {shippingCost === 0 && (
              <p className="text-green-500 text-xs mb-4 font-semibold">✓ Free shipping qualified</p>
            )}

            <button
              onClick={() => navigate("/checkout")}
              className="w-full premium-button-primary mb-3"
            >
              Proceed to Checkout
            </button>

            <button
              onClick={() => navigate("/shop")}
              className="w-full premium-button-secondary mb-4"
            >
              Continue Shopping
            </button>

            <button
              onClick={clearCart}
              className="w-full py-2 text-red-500 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
            >
              Clear Cart
            </button>

            {/* Promo Code (Mock) */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-[#0B0B0D] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C8102E]"
                />
                <button onClick={applyPromoCode} className="bg-[#C8102E] text-white px-3 py-2 rounded font-semibold text-sm hover:bg-[#a00a25] transition">
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p className={`mt-2 text-xs ${promoDiscount > 0 ? "text-emerald-400" : "text-amber-400"}`}>{promoMessage}</p>
              )}
              <p className="mt-2 text-[11px] text-slate-500">Tip: Try SAVE10 or FREESHIP</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
