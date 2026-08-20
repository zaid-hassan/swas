"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const q = query.trim();

    if (!q) return;

    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <label
        className="
          flex w-full items-center gap-3
          bg-burgundy-rich rounded-full
          px-4 py-1.5
          cursor-text
        "
      >
        <Search
          size={16}
          strokeWidth={1.5}
          className="shrink-0 text-gold-warm transition-colors duration-300"
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jewellery..."
          aria-label="Search jewellery"
          className="
            w-full
            border-none
            bg-transparent
            p-0
            text-[13px]
            font-light
            tracking-wide
            text-cream
            outline-none
            placeholder:text-cream/35
          "
        />
      </label>
    </form>
  );
}