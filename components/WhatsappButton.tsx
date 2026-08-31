"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "917766061511";

  function openWhatsApp() {
    window.open(
      `https://wa.me/${phoneNumber}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <button
      type="button"
      onClick={openWhatsApp}
      aria-label="Chat with SWAS on WhatsApp"
      className="
        fixed
        bottom-5
        right-5
        z-50
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        bg-[#25D366]
        text-white
        shadow-lg
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-xl
        active:scale-95
        md:bottom-6
        md:right-6
        md:h-15
        md:w-15
      "
    >
      <MessageCircle
        className="h-7 w-7 md:h-8 md:w-8"
        strokeWidth={2}
      />
    </button>
  );
}
