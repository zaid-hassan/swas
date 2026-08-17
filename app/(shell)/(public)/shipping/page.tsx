export default function ShippingPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
          Shipping Policy
        </p>

        <h1 className="mb-10 text-5xl font-light">Delivered with care.</h1>

        <div className="space-y-8 text-neutral-700 leading-8">
          <section>
            <h2 className="mb-2 text-2xl text-black">Order Processing</h2>
            <p>
              Orders are typically processed within 1–3 business days. Custom
              jewellery may require additional production time.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Shipping Partner</h2>
            <p>
              SWAS ships across India using Blue Dart and other trusted courier
              partners where applicable.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Delivery Time</h2>
            <p>
              Standard delivery generally takes 3–7 business days after dispatch,
              depending on your location.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Tracking</h2>
            <p>
              Once your order is dispatched, you'll receive a tracking ID that
              allows you to monitor your shipment.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Delivery Issues</h2>
            <p>
              If your package is delayed or damaged during transit, please
              contact us as soon as possible.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}