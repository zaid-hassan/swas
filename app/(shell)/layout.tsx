import Navbar from '@/components/global/navbar/Navbar'
import React from 'react'

function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div>
    <div className=""><Navbar /></div>
    {children}</div>
}

export default Layout