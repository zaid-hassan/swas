export default function ReturnsPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
          Returns & Exchanges
        </p>

        <h1 className="mb-10 text-5xl font-light">
          Simple and transparent.
        </h1>

        <div className="space-y-8 text-neutral-700 leading-8">
          <section>
            <h2 className="mb-2 text-2xl text-black">Return Eligibility</h2>
            <p>
              Returns are accepted for eligible items within the specified return
              window, provided they remain unused and in their original
              condition.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Custom Jewellery</h2>
            <p>
              Bespoke and personalized jewellery is generally non-returnable,
              except in cases of manufacturing defects.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Damaged Items</h2>
            <p>
              If your order arrives damaged, contact us within 48 hours with
              clear photos so we can assist you promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Refunds</h2>
            <p>
              Approved refunds are processed through the original payment method
              after inspection of the returned item.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}