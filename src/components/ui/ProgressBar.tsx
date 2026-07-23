interface ProgressBarProps {
  value: number;
  colorClassName?: string;
}

export function ProgressBar({ value, colorClassName = "bg-brand-600" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${colorClassName} rounded-full`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
