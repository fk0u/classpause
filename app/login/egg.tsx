"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Flower } from "@/components/doodles";

/** Easter egg: tap the flower five times to open the demo campus. */
export default function EggFlower({ className }: { className?: string }) {
  const router = useRouter();
  const taps = useRef<number[]>([]);
  return (
    <button aria-hidden tabIndex={-1} className={className} onClick={() => {
      const now = Date.now();
      taps.current = [...taps.current.filter((x) => now - x < 2500), now];
      if (taps.current.length >= 5) { taps.current = []; router.push("/login?demo"); }
    }}>
      <Flower className="w-full" />
    </button>
  );
}
