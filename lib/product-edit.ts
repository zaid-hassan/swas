import type { AdminProduct } from "@/types/products";

export type ProductEditInput = Pick<
  AdminProduct,
  | "name"
  | "price"
  | "image"
  | "images"
  | "videos"
  | "category"
  | "description"
  | "material"
  | "design"
  | "finish"
  | "idealFor"
  | "collectionId"
  | "isVisible"
>;

/** Map the admin's complete product form to the Firestore's fixed media slots. */
export function buildProductEditPatch(input: ProductEditInput) {
  const images = input.images.slice(0, 4);
  const videos = input.videos.slice(0, 3);
  return {
    name: input.name,
    mrp: input.price,
    category: input.category,
    description: input.description,
    material: input.material,
    design: input.design,
    finish: input.finish,
    idealFor: input.idealFor,
    collectionId: input.collectionId ?? "",
    image: images[0] ?? "",
    image1: images[1] ?? "",
    image2: images[2] ?? "",
    image3: images[3] ?? "",
    video: videos[0] ?? "",
    video1: videos[1] ?? "",
    video2: videos[2] ?? "",
    isVisible: input.isVisible,
  };
}
