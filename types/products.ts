export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;      // Cover image (used everywhere)
  images: string[];   // Gallery images 
  slug: string;
  category: string;
  description: string;
  material: string;
  design: string;
  finish: string;
  idealFor: string;
};