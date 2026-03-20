import { createContext, useState, ReactNode } from "react";
import { Product, CartContextType, Cart, CartItem } from "../types";

export const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : { items: [], total: 0 };
    }
    return { items: [], total: 0 };
  });

  const calculateTotal = (items: CartItem[]) => {
    return Math.round(
      items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100
    ) / 100;
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.items.find(
        (item) => item.productId === product.id
      );

      let newItems;
      if (existingItem) {
        newItems = prevCart.items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [
          ...prevCart.items,
          {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            product,
            quantity: 1,
          },
        ];
      }

      const newTotal = calculateTotal(newItems);
      const newCart = { items: newItems, total: newTotal };

      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter(
        (item) => item.productId !== productId
      );
      const newTotal = calculateTotal(newItems);
      const newCart = { items: newItems, total: newTotal };

      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const updateCartItem = (productId: string, quantity: number) => {
    setCart((prevCart) => {
      let newItems;
      if (quantity <= 0) {
        newItems = prevCart.items.filter(
          (item) => item.productId !== productId
        );
      } else {
        newItems = prevCart.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
      }

      const newTotal = calculateTotal(newItems);
      const newCart = { items: newItems, total: newTotal };

      localStorage.setItem("cart", JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    const newCart = { items: [], total: 0 };
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const cartItemCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        cartTotal: cart.total,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};