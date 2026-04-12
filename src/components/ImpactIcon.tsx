interface ImpactIconProps {
  type: string;
}

const iconMap: Record<string, { symbol: string; color: string }> = {
  threat: { symbol: "!", color: "text-red-500" },
  opportunity: { symbol: "+", color: "text-green-500" },
  info: { symbol: "i", color: "text-blue-500" },
};

export default function ImpactIcon({ type }: ImpactIconProps) {
  const icon = iconMap[type] ?? iconMap["info"];
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full border font-bold text-xs ${icon.color} border-current`}
    >
      {icon.symbol}
    </span>
  );
}
