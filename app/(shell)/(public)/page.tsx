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
        video="https://res.cloudinary.com/dndppvnjl/video/upload/v1787232893/0820_vhpjoo.mp4"
      />
      <Showcase />
      <Catalogue />
      <FeaturedVideoCarousel />
      <HeroFeatures />
    </div>
  );
}

export default page;
