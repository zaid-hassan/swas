export function loadLocalCart(){
  if(typeof window==="undefined") return []

  const cart=localStorage.getItem("cart")
  return cart?JSON.parse(cart):[]
}