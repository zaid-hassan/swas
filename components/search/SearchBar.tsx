"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * SearchBar
 * Path: components/search/SearchBar.tsx
 *
 * Minimal, sharp-edged — jewellery brands don't do pill inputs.
 * Warm bg that transitions to white on focus; gold border accent.
 */
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
      <label className="
        flex items-center gap-2.5
        bg-warm border border-swas-border
        px-4 py-[9px] cursor-text
        transition-colors duration-200
        focus-within:border-gold focus-within:bg-white
      ">
        <Search size={14} strokeWidth={1.5} className="text-swas-grey shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jewellery…"
          className="
            w-full bg-transparent border-none outline-none
            text-[13px] text-ink placeholder:text-swas-grey
            font-sans font-light tracking-wide
          "
        />
      </label>
    </form>
  );
}