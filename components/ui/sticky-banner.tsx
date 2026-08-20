"use client";

import React, { SVGProps, useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "swas-banner-dismissed";

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(true);
  const { scrollY } = useScroll();

  // Check if banner was previously dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (dismissed) return;

    if (hideOnScroll) {
      setVisible(latest <= 40);
    }
  });

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <motion.div
      className={cn(
        "sticky inset-x-0 top-0 z-40 flex min-h-14 w-full items-center justify-center px-4 py-1",
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{
        y: visible ? 0 : -100,
        opacity: visible ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {children}

      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 text-burgundy transition hover:text-burgundy-rich"
        onClick={handleClose}
        aria-label="Close banner"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </motion.div>
  );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);