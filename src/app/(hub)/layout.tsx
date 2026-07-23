import { HubSidebar } from "@/components/layout/HubSidebar";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <HubSidebar />
      {children}
    </div>
  );
}
