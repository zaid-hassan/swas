"use client"

import { create } from "zustand"

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

type CartState = {
  items: CartItem[]
  setItems: (items: CartItem[]) => void
  addItem: (item: Omit<CartItem,"quantity">) => void
  removeItem: (id: string) => void
  increase: (id: string) => void
  decrease: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>((set,get)=>({

  items: [],

  setItems: (items)=>set({items}),

  addItem:(item)=>{
    const existing = get().items.find(i=>i.id===item.id)

    let updated

    if(existing){
      updated = get().items.map(i =>
        i.id===item.id
          ? {...i, quantity:i.quantity+1}
          : i
      )
    } else {
      updated=[...get().items,{...item,quantity:1}]
    }

    set({items:updated})

    localStorage.setItem("cart",JSON.stringify(updated))
  },

  removeItem:(id)=>{
    const updated=get().items.filter(i=>i.id!==id)
    set({items:updated})
    localStorage.setItem("cart",JSON.stringify(updated))
  },

  increase:(id)=>{
    const updated=get().items.map(i =>
      i.id===id ? {...i,quantity:i.quantity+1}:i
    )

    set({items:updated})
    localStorage.setItem("cart",JSON.stringify(updated))
  },

  decrease:(id)=>{
    const updated=get().items
      .map(i => i.id===id ? {...i,quantity:i.quantity-1}:i)
      .filter(i=>i.quantity>0)

    set({items:updated})
    localStorage.setItem("cart",JSON.stringify(updated))
  },

  clearCart:()=>{
    set({items:[]})
    localStorage.removeItem("cart")
  }

}))