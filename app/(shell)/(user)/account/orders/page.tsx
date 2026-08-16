import { auth } from "@/lib/firebase";
import { redirect } from "next/navigation";
import OrdersClient from "@/components/orders/OrdersClient";

export default async function OrdersPage() {
  return <OrdersClient />;
}