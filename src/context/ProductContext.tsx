import { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Product } from "../types";
import { API_BASE_URL } from "../config/api";

type ProductContextType = {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (category?: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
};

type ApiProduct = {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  stock: number;
  seller_id: number;
  created_at: string;
};

const ProductContext = createContext<ProductContextType | null>(null);

const mapApiProductToUiProduct = (apiProduct: ApiProduct): Product => ({
  id: String(apiProduct.id),
  name: apiProduct.name,
  price: apiProduct.price,
  description: apiProduct.description,
  image: apiProduct.image_url,
  images: [apiProduct.image_url],
  category: apiProduct.category,
  stock: apiProduct.stock,
  rating: 4.5,
  reviews: 0,
  sellerId: String(apiProduct.seller_id),
  sellerName: "Seller",
  inStock: apiProduct.stock > 0,
});

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchProducts = useCallback(async (category?: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (category) {
        query.set("category", category);
      }
      const endpoint = query.toString() ? `${API_BASE_URL}/products?${query.toString()}` : `${API_BASE_URL}/products`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data: ApiProduct[] = await response.json();
      if (requestId !== requestIdRef.current) {
        return;
      }
      setProducts(data.map(mapApiProductToUiProduct));
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to fetch products";
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    setError(null);
    const payload = {
      name: product.name,
      price: product.price,
      description: product.description,
      image_url: product.image,
      category: product.category,
      stock: product.stock ?? 0,
      seller_id: Number.parseInt(product.sellerId, 10) || 1,
    };

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || "Failed to add product");
    }

    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }
  return context;
};