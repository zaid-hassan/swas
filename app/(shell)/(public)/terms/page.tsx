export default function TermsPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
          Terms & Conditions
        </p>

        <h1 className="mb-10 text-5xl font-light">
          Terms of using SWAS.
        </h1>

        <div className="space-y-8 text-neutral-700 leading-8">
          <section>
            <h2 className="mb-2 text-2xl text-black">Orders</h2>
            <p>
              Orders are confirmed after successful payment. Custom jewellery
              orders may require additional confirmation before production.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Pricing</h2>
            <p>
              Prices are listed in Indian Rupees (INR). We reserve the right to
              update prices without prior notice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Custom Orders</h2>
            <p>
              Custom-designed jewellery is crafted specifically for you and may
              not be eligible for cancellation once production has begun.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Product Images</h2>
            <p>
              We strive for accurate photography, but slight variations in color
              or finish may occur due to lighting and screen settings.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Liability</h2>
            <p>
              SWAS is not responsible for delays caused by courier services,
              natural events, or circumstances beyond our control.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}