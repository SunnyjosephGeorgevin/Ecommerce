// User types
export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  category: string;
  rating: number;

  reviews: number;
  sellerId: string;
  sellerName: string;
  inStock: boolean;

  stock?: number;
}

export type ProductCategory =
  | "mobile"
  | "laptop"
  | "fashion"
  | "footwear"
  | "sneakers"
  | "apparel"
  | "accessories"
  | "new-arrivals";

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  deliveryDate?: string;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "canceled";

// Filter types
export interface ProductFilters {
  category?: ProductCategory;
  priceRange: [number, number];
  rating?: number;
  search?: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: Exclude<UserRole, "admin">) => Promise<{ pendingApproval: boolean }>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

// Cart context types
export interface CartContextType {
  cart: Cart;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}
