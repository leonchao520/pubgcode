"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResultRedirect({ name }: { name: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/player/${encodeURIComponent(decodeURIComponent(name))}`);
  }, [name, router]);

  return (
    <div style={{ backgroundColor: "#000", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>跳转中...</p>
    </div>
  );
}
