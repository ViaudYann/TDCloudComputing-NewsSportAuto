"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RafraichissementAuto({ intervalle = 5000 }: { intervalle?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalle);
    return () => clearInterval(id);
  }, [router, intervalle]);

  return null;
}