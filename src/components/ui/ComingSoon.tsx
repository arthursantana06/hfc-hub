import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center py-20 px-6 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-brand-300/10 text-brand-600 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7" />
      </div>
      <span className="font-inter text-[11px] font-medium uppercase tracking-wider text-brand-600 bg-brand-300/15 px-2.5 py-1 rounded-full mb-4">
        Em breve
      </span>
      <h2 className="font-poppins font-medium text-xl text-brand-950 mb-2">{title}</h2>
      <p className="font-inter text-sm text-slate-500">{description}</p>
    </div>
  );
}
