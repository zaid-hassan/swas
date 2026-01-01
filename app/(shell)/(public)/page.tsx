import Hero from '@/components/sections/hero/Hero'
import Showcase from '@/components/sections/showcase/Showcase'
import Catalogue from '@/components/sections/catalogue/Catalogue'
import React from 'react'

function page() {
  return (
    <div>
        <Hero />
        <Showcase />
        <Catalogue />
    </div>
  )
}

export default page