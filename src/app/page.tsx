import Link from "next/link";

export default function HomePage() {
  const steps = [
    { num: "1", title: "Snapshot", desc: "Playwright captures the full rendered page — JavaScript, dynamic pricing tables, everything a real browser sees." },
    { num: "2", title: "Normalize", desc: "Strips nav, footer, scripts, and styling. Extracts just the main content, cutting tokens sent to Claude by 60-80%." },
    { num: "3", title: "Extract", desc: "Claude analyzes the clean HTML and extracts structured data: pricing plans, features, positioning, and content updates." },
    { num: "4", title: "Diff", desc: "Compares current extraction against the previous snapshot. Detects price changes, new features, audience pivots." },
    { num: "5", title: "Score", desc: "Deterministic rules assign threat levels. A 25% price drop is critical. A new enterprise tier is high. A blog post is low." },
    { num: "6", title: "Alert", desc: "Medium+ threats generate alerts with dedup. Optional webhook fires to Slack, Discord, or any endpoint." },
  ];

  return (
    <div className="space-y-16 max-w-4xl mx-auto py-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">RivalSight</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Track competitor changes automatically — pricing shifts, new features, positioning pivots — and score how much each change matters.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Link href="/dashboard" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
            Open Dashboard
          </Link>
          <Link href="/competitors" className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            View Competitors
          </Link>
        </div>
      </div>

      {/* How it works — 6-step pipeline */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <p className="text-sm text-gray-500 text-center">Add a competitor URL, click monitor — the pipeline runs in seconds.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.num} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{s.num}</div>
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Threat levels */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Threat Scoring</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">Critical</p>
            <p className="text-xs text-red-600 mt-1">Price dropped &gt;10%, direct competitive threat</p>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-sm font-medium text-orange-700">High</p>
            <p className="text-xs text-orange-600 mt-1">New features, new pricing tiers, audience pivot</p>
          </div>
          <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-700">Medium</p>
            <p className="text-xs text-yellow-600 mt-1">Price increases (opportunity), tagline changes, breaking changelog</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">Low</p>
            <p className="text-xs text-green-600 mt-1">Blog posts, minor announcements, informational updates</p>
          </div>
        </div>
      </div>

      {/* Quick demo */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center space-y-3">
        <p className="text-sm font-medium text-indigo-800">Quick Demo</p>
        <p className="text-xs text-indigo-600">No API key needed — the app ships with sample data from 4 fictional competitors across 7 watch targets, covering every pipeline path: baseline runs, critical price drops, new feature detection, and hash-skip optimization.</p>
        <Link href="/dashboard" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          Explore the Dashboard
        </Link>
      </div>

      {/* Tech */}
      <div className="text-center space-y-2 pb-8">
        <p className="text-xs text-gray-400">Built with Next.js, Claude API, Playwright, Drizzle ORM, SQLite, Zod, and Tailwind CSS</p>
      </div>
    </div>
  );
}
