import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import { useCart } from "../hooks/useContext";
import { useAuth } from "../hooks/useContext";
import { API_BASE_URL } from "../config/api";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVC: "",
  });

  const shippingCost = cartTotal > 100 ? 0 : 15;
  const taxCost = Math.round(cartTotal * 0.08 * 100) / 100;
  const finalTotal = cartTotal + shippingCost + taxCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const numericUserId = Number.parseInt(user?.id ?? "", 10) || 1;
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: numericUserId,
          total: finalTotal,
          items_count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          status: "confirmed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const createdOrder: { id: number } = await response.json();
      setOrderId(String(createdOrder.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      alert(message);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(false);
    setPaymentSuccess(true);

    // Clear cart after successful payment
    clearCart();
  };

  if (paymentSuccess) {
    return (
      <div className="bg-[#0B0B0D] text-white min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <CheckCircle size={80} className="mx-auto text-green-500" />
            </motion.div>

            <h1 className="text-4xl font-black mb-2">Order Confirmed!</h1>
            <p className="text-gray-400 mb-2">Thank you for your purchase</p>
            <p className="text-[#C8102E] text-2xl font-bold mb-8">Order #{orderId ?? "-"}</p>

            <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-8 mb-8 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-gray-400 text-sm">Subtotal</p>
                  <p className="font-semibold">${cartTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Shipping</p>
                  <p className="font-semibold">{shippingCost === 0 ? "FREE" : `$${shippingCost}`}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tax</p>
                  <p className="font-semibold">${taxCost.toFixed(2)}</p>
                </div>
                <div className="border-t border-gray-700 pt-2">
                  <p className="text-gray-400 text-sm">Total</p>
                  <p className="font-bold text-[#C8102E] text-lg">${finalTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <p className="text-gray-400 mb-8">
              You will receive a confirmation email shortly with order details and tracking information.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate("/shop")}
                className="premium-button-primary"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate("/")}
                className="premium-button-secondary"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <button
              onClick={() => navigate("/shop")}
              className="premium-button-primary"
            >
              Back to Shop
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0B0D] text-white min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="text-[#C8102E] text-sm font-bold uppercase tracking-widest">Step 3</span>
          <h1 className="text-5xl md:text-6xl font-black mt-2">Checkout</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handlePayment} className="space-y-6">
              {/* Shipping Information */}
              <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="col-span-2 bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="col-span-2 bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="col-span-2 bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <input
                    type="text"
                    name="zip"
                    placeholder="ZIP Code"
                    value={formData.zip}
                    onChange={handleInputChange}
                    required
                    className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Payment Information</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="Card Number"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                    maxLength={19}
                    className="w-full bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="cardExpiry"
                      placeholder="MM/YY"
                      value={formData.cardExpiry}
                      onChange={handleInputChange}
                      required
                      maxLength={5}
                      className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                    />
                    <input
                      type="text"
                      name="cardCVC"
                      placeholder="CVC"
                      value={formData.cardCVC}
                      onChange={handleInputChange}
                      required
                      maxLength={4}
                      className="bg-[#0B0B0D] border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-[#C8102E] text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isProcessing}
                className="w-full premium-button-primary py-3 text-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-[#C8102E] rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Purchase ${finalTotal.toFixed(2)}
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1a1a1f] border border-gray-800 rounded-lg p-6 h-fit"
          >
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 pb-4 border-b border-gray-700 max-h-64 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.product.name} x {item.quantity}</span>
                  <span className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm mb-4 pb-4 border-b border-gray-700">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? "FREE" : `$${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax</span>
                <span>${taxCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-[#C8102E]">${finalTotal.toFixed(2)}</span>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              💳 Use card 4242 4242 4242 4242 for demo
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
