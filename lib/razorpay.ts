import Razorpay from "razorpay";

let client: Razorpay | null = null;

/**
 * Lazily build the Razorpay client.
 *
 * Constructing it at module scope makes `next build` fail while collecting
 * page data (the module is evaluated with no runtime env), and it also breaks
 * local builds that have no payment credentials — the same reason
 * `lib/firebase-admin.ts` is only imported lazily inside routes.
 */
export function getRazorpay(): Razorpay {
  if (!client) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured");
    }

    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return client;
}
