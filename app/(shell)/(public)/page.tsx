import Hero from "@/components/sections/hero/Hero";
import Showcase from "@/components/sections/showcase/Showcase";
import Catalogue from "@/components/sections/catalogue/Catalogue";
import React from "react";
import TrustBar from "@/components/sections/trustbar/TrustBar";
import HeroFeatures from "@/components/sections/features/HeroFeatures";
import FeaturedVideoCarousel from "@/components/sections/features/FeaturedVideoCarousel";
import CollectionFilm from "@/components/sections/collection/CollectionFilm";

function page() {
  return (
    <div>
      <Hero />
      <CollectionFilm
        title="Taruni Collection"
        href="/collection/taruni"
        video="https://res.cloudinary.com/dndppvnjl/video/upload/f_mp4,vc_h264,q_auto/v1787426419/577CAC23-E760-48F1-A08C-6615D47C1594_g1h6gl.mp4"
      />
      <Showcase />
      <Catalogue />
      <FeaturedVideoCarousel />
      <HeroFeatures />
    </div>
  );
}

export default page;
