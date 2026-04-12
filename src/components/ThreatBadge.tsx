interface ThreatBadgeProps {
  level: string;
}

const colorMap: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export default function ThreatBadge({ level }: ThreatBadgeProps) {
  const colors = colorMap[level] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {level}
    </span>
  );
}
