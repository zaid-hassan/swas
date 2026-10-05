import Hero from "@/components/sections/hero/Hero";
import Showcase from "@/components/sections/showcase/Showcase";
import Catalogue from "@/components/sections/catalogue/Catalogue";
import React from "react";
import TrustBar from "@/components/sections/trustbar/TrustBar";
import HeroFeatures from "@/components/sections/features/HeroFeatures";
import FeaturedVideoCarousel from "@/components/sections/features/FeaturedVideoCarousel";
import CollectionFilm from "@/components/sections/collection/CollectionFilm";

import { getHomeVideos } from "@/lib/site-settings";

// Catalog is read from Firestore at request time (cached in lib/products),
// so the page must not be prerendered with a build-time Firestore read.
// The home videos are read the same way (see lib/site-settings).
export const dynamic = "force-dynamic";

async function page() {
  const videos = await getHomeVideos();

  return (
    <div>
      <Hero video={videos.hero} />
      <CollectionFilm
        title="Taruni Collection"
        href="/collection/taruni"
        video={videos.collectionFilm}
      />
      <Showcase />
      <Catalogue />
      <FeaturedVideoCarousel videos={videos.carousel} />
      <HeroFeatures />
    </div>
  );
}

export default page;
