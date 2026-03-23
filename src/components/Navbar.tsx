import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { useCart } from "../hooks/useContext";
import { useAuth } from "../hooks/useContext";
import { PRODUCT_CATEGORIES } from "../constants/categories";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { cartItemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setIsCompact(window.scrollY > 30);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeCategory = useMemo(() => {
    if (!location.pathname.startsWith("/shop")) {
      return null;
    }
    const params = new URLSearchParams(location.search);
    return params.get("category")?.toLowerCase() ?? null;
  }, [location.pathname, location.search]);

  const handleCategoryClick = (category: string) => {
    navigate(`/shop?category=${category}`);
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0B0B0D]/90 backdrop-blur-xl transition-all duration-300">
      <div className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isCompact ? "py-2.5" : "py-4"}`}>
        {/* Logo */}
        <Link to="/" className="group inline-flex items-center gap-2 text-2xl font-black tracking-wide transition">
          <span className="bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent group-hover:from-rose-100 group-hover:to-rose-400">
            SpectraCart
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-200" role="navigation" aria-label="Product categories">
          {PRODUCT_CATEGORIES.slice(0, 4).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`relative uppercase tracking-wide transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 rounded ${activeCategory === category ? "text-rose-300" : "hover:text-rose-300"}`}
              aria-current={activeCategory === category ? "page" : undefined}
            >
              {category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-300 ${activeCategory === category ? "w-full" : "w-0 group-hover:w-full"}`} />
            </button>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Cart */}
          <Link 
            to="/cart" 
            className="relative rounded-xl border border-slate-700/80 bg-slate-900/70 p-2.5 text-slate-100 hover:border-rose-400/70 hover:text-rose-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-br from-rose-500 to-rose-700 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link 
            to={user ? (user.role === "seller" ? "/seller" : user.role === "admin" ? "/admin" : "/account") : "/login"}
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 p-2.5 text-slate-100 hover:border-rose-400/70 hover:text-rose-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
          >
            <User size={20} />
          </Link>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden rounded-xl border border-slate-700/80 bg-slate-900/70 p-2.5 text-slate-100 hover:border-rose-400/70 hover:text-rose-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B0B0D]/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-left text-sm font-medium capitalize text-slate-200 hover:border-rose-500/70 hover:text-rose-200 transition"
              >
                {category.replace(/-/g, " ")}
              </button>
            ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}