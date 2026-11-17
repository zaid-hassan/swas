export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;      // Cover image (used everywhere)
  images: string[];   // Gallery images
  videos: string[];   // Gallery videos (interleaved with images)
  slug: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  stockStatus: "in_stock" | "out_of_stock";
  description: string;
  material: string;
  design: string;
  finish: string;
  idealFor: string;
  collectionId?: string;
};

export type AdminProduct = Product & {
  isVisible: boolean;
};