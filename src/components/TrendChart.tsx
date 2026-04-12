"use client";

interface TrendDataPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

const LEVELS = ["critical", "high", "medium", "low"] as const;

const levelColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-gray-300",
};

export default function TrendChart({ data }: TrendChartProps) {
  const maxTotal = Math.max(
    1,
    ...data.map((d) => d.critical + d.high + d.medium + d.low)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-medium text-gray-700 mb-4">
        Changes — Last 30 Days
      </h2>
      <div className="flex items-end gap-1 h-32">
        {data.map((d, i) => {
          const total = d.critical + d.high + d.medium + d.low;
          const heightPct = (total / maxTotal) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end"
              title={`${d.date}: ${total} changes`}
            >
              <div
                className="w-full flex flex-col-reverse overflow-hidden rounded-sm"
                style={{ height: `${heightPct}%`, minHeight: total > 0 ? "2px" : "0" }}
              >
                {LEVELS.map((level) => {
                  const count = d[level];
                  if (count === 0) return null;
                  const pct = (count / total) * 100;
                  return (
                    <div
                      key={level}
                      className={levelColors[level]}
                      style={{ height: `${pct}%` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {/* X-axis: show first, middle, last date */}
      {data.length > 0 && (
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{data[0].date}</span>
          {data.length > 2 && <span>{data[Math.floor(data.length / 2)].date}</span>}
          <span>{data[data.length - 1].date}</span>
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`inline-block w-3 h-3 rounded-sm ${levelColors[level]}`} />
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
}
