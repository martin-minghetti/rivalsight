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
      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Running…" : "Run Monitor Now"}
    </button>
  );
}
