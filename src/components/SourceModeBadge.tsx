interface SourceModeBadgeProps {
  mode: string;
}

const colorMap: Record<string, string> = {
  live: "bg-green-100 text-green-800",
  sample: "bg-blue-100 text-blue-800",
  fallback: "bg-gray-100 text-gray-600",
};

export default function SourceModeBadge({ mode }: SourceModeBadgeProps) {
  const colors = colorMap[mode] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {mode}
    </span>
  );
}
