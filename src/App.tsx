import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import CartDrawer from "./components/CartDrawer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./hooks/useContext";
import Chatbot from "./components/Chatbot";

export default function App() {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { isLoggedIn, user } = useAuth();

  const defaultAuthenticatedPath =
    user?.role === "admin" ? "/admin" : user?.role === "seller" ? "/seller" : "/";

  const withAuthGuard = (element: JSX.Element) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return element;
  };

  const withGuestGuard = (element: JSX.Element) => {
    if (isLoggedIn) {
      return <Navigate to={defaultAuthenticatedPath} replace />;
    }
    return element;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={withAuthGuard(<Home />)} />
        <Route path="/shop" element={withAuthGuard(<Shop />)} />
        <Route path="/product/:id" element={withAuthGuard(<ProductDetail />)} />
        <Route path="/cart" element={withAuthGuard(<Cart />)} />
        <Route path="/checkout" element={withAuthGuard(<Checkout />)} />
        <Route path="/login" element={withGuestGuard(<Login />)} />
        <Route path="/register" element={withGuestGuard(<Register />)} />
        <Route path="/account" element={withAuthGuard(<Account />)} />
        <Route path="/seller" element={withAuthGuard(<SellerDashboard />)} />
        <Route path="/admin" element={withAuthGuard(<AdminDashboard />)} />
        <Route path="*" element={<Navigate to={isLoggedIn ? defaultAuthenticatedPath : "/login"} replace />} />
      </Routes>

      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
      <Chatbot />
    </>
  );
}