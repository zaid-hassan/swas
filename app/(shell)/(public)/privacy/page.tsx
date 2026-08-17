export default function PrivacyPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
          Privacy Policy
        </p>

        <h1 className="mb-10 text-5xl font-light">Your privacy matters.</h1>

        <div className="space-y-8 text-neutral-700 leading-8">
          <section>
            <h2 className="mb-2 text-2xl text-black">Information We Collect</h2>
            <p>
              We collect the information you provide during purchases, inquiries,
              and custom jewellery requests, including your name, email, phone
              number, shipping address, and payment details processed securely by
              our payment provider.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">How We Use It</h2>
            <p>
              Your information is used to process orders, provide customer
              support, improve our services, and communicate important updates
              regarding your purchases.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Payment Security</h2>
            <p>
              Payments are processed through secure payment gateways. SWAS does
              not store your complete card information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Cookies</h2>
            <p>
              We may use cookies to improve your browsing experience and analyze
              website performance.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-2xl text-black">Contact</h2>
            <p>
              For privacy-related questions, contact us through our Contact page.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}