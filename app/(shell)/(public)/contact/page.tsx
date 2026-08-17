import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-[#D4AF37]">
          Contact SWAS
        </p>

        <h1 className="mb-8 text-5xl font-light">
          We'd love to hear from you.
        </h1>

        <p className="max-w-2xl text-lg leading-8 text-neutral-600">
          Have questions about an order, custom jewellery, or product care? Get
          in touch and we'll be happy to help.
        </p>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="space-y-5 rounded-3xl border border-neutral-200 p-8">
            <div className="flex items-start gap-4">
              <Mail className="mt-1 text-[#D4AF37]" />
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-neutral-600">support@swas.in</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="mt-1 text-[#D4AF37]" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-neutral-600">Available during business hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MessageCircle className="mt-1 text-[#D4AF37]" />
              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <p className="text-neutral-600">
                  Reach out for custom jewellery inquiries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="mt-1 text-[#D4AF37]" />
              <div>
                <h3 className="font-medium">India</h3>
                <p className="text-neutral-600">
                  Crafted and shipped across India.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8">
            <h2 className="mb-4 text-2xl font-light">Custom Jewellery</h2>

            <p className="mb-6 text-neutral-600 leading-7">
              Looking for a personalized piece? Share your design idea, reference
              images, preferred metal, and size, and our team will guide you
              through the custom order process.
            </p>

            <div className="rounded-2xl bg-white p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[#D4AF37]">
                Response Time
              </p>
              <p className="mt-2 text-neutral-700">
                We aim to respond to most inquiries within 24–48 business hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}