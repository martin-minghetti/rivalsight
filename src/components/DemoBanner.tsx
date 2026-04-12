import Link from "next/link";

export default function DemoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
      <span className="font-medium">Demo Mode</span>
      <span>—</span>
      <span>
        No API key configured. Showing sample data.{" "}
        <Link href="/settings" className="underline font-medium hover:text-blue-900">
          Add your API key
        </Link>{" "}
        for live monitoring.
      </span>
    </div>
  );
}
