// app/components/SpotifyLoader.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SpotifyLoader({
  onLoad,
}: {
  onLoad: (url: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.get("url");
    if (url) onLoad(url);
  }, [searchParams, onLoad]);

  return null;
}
