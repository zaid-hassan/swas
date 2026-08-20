import Hero from '@/components/sections/hero/Hero'
import Showcase from '@/components/sections/showcase/Showcase'
import Catalogue from '@/components/sections/catalogue/Catalogue'
import React from 'react'
import TrustBar from '@/components/sections/trustbar/TrustBar'
import HeroFeatures from '@/components/sections/features/HeroFeatures'

function page() {
  return (
    <div>
        <Hero />
        <Showcase />
        <Catalogue />
        <HeroFeatures />
    </div>
  )
}

export default page