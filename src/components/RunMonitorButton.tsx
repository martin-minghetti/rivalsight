"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunMonitorButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRun() {
    setLoading(true);
    try {
      await fetch("/api/monitor", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={loading}
      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md whitespace-nowrap hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Running…" : "Run Monitor Now"}
    </button>
  );
}
