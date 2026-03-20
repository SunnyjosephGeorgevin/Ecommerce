import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useCart } from "../hooks/useContext";
import { useAuth } from "../hooks/useContext";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    navigate(`/shop?category=${category}`);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0B0B0D] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
      <div className="flex justify-between items-center px-8 py-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold tracking-wider hover:text-[#C8102E] transition">
          AI SHOP
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 text-sm font-medium">
          {PRODUCT_CATEGORIES.slice(0, 4).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className="hover:text-[#C8102E] transition duration-300 relative group"
            >
              {category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#C8102E] group-hover:w-full transition-all duration-300"></span>
            </button>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex gap-6 items-center">
          {/* Cart */}
          <Link 
            to="/cart" 
            className="relative hover:text-[#C8102E] transition cursor-pointer group"
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#C8102E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link 
            to={user ? (user.role === "seller" ? "/seller" : user.role === "admin" ? "/admin" : "/account") : "/login"}
            className="hover:text-[#C8102E] transition"
          >
            <User size={20} />
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden hover:text-[#C8102E] transition"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-[#0B0B0D]">
          <div className="px-8 py-4 space-y-3">
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="block w-full text-left py-2 hover:text-[#C8102E] transition capitalize"
              >
                {category.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}