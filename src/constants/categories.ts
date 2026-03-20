export const PRODUCT_CATEGORIES = [
  "mobile",
  "laptop",
  "fashion",
  "footwear",
  "sneakers",
  "apparel",
  "accessories",
  "new-arrivals",
] as const;

export type ProductCategoryOption = (typeof PRODUCT_CATEGORIES)[number];

export const SIZE_BASED_CATEGORIES = new Set<string>([
  "footwear",
  "sneakers",
  "fashion",
  "apparel",
  "new-arrivals",
]);
