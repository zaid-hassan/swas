export default function AboutPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
          About SWAS
        </p>

        <h1 className="mb-8 text-5xl font-light leading-tight">
          Crafted to carry meaning.
        </h1>

        <div className="space-y-6 text-lg leading-8 text-neutral-700">
          <p>
            SWAS creates timeless jewellery designed for everyday elegance and
            meaningful moments. Every piece is crafted with attention to detail,
            premium materials, and a minimalist aesthetic that celebrates
            personal expression.
          </p>

          <p>
            From 925 sterling silver essentials to custom-made creations, our
            mission is simple—create jewellery that feels personal, lasts longer,
            and becomes part of your story.
          </p>

          <p>
            Whether you're gifting someone special or choosing something for
            yourself, every SWAS piece is designed to blend modern craftsmanship
            with timeless style.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            ["925 Sterling Silver", "Premium craftsmanship"],
            ["Custom Jewellery", "Designed around your vision"],
            ["Made in India", "Carefully crafted with quality"],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl border border-neutral-200 p-6">
              <div className="mb-3 h-8 w-8 rotate-45 bg-[#D4AF37]/20" />
              <h3 className="mb-2 text-lg font-medium">{title}</h3>
              <p className="text-neutral-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}