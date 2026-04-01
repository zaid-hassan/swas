import Hero from '@/components/sections/hero/Hero'
import Showcase from '@/components/sections/showcase/Showcase'
import Catalogue from '@/components/sections/catalogue/Catalogue'
import React from 'react'
import TrustBar from '@/components/sections/trustbar/TrustBar'

function page() {
  return (
    <div>
        <Hero />
        <TrustBar />
        <Showcase />
        <Catalogue />
    </div>
  )
}

export default page