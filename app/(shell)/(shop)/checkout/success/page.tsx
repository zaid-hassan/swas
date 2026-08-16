import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-24 text-center">
      <CheckCircle2
        className="mx-auto text-green-600"
        size={72}
      />

      <h1 className="mt-6 text-3xl font-bold">
        Order Placed Successfully
      </h1>

      <p className="mt-4 text-muted-foreground">
        Thank you for shopping with SWAS. We've received your order and
        will begin processing it shortly.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>

        <Link href="/account/orders">
          <Button variant="outline">
            My Orders
          </Button>
        </Link>
      </div>
    </section>
  );
}