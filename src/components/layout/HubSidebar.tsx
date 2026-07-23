import { LayoutDashboard, Users, LineChart, Settings } from "lucide-react";
import { SideNavLink } from "./SideNavLink";

export function HubSidebar() {
  return (
    <aside className="w-64 bg-brand-900 flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-300 overflow-hidden shrink-0 flex items-center justify-center">
          <span className="text-brand-900 font-poppins font-semibold">FP</span>
        </div>
        <span className="font-poppins font-medium text-white">Planejador HFC</span>
      </div>

      <nav className="flex-1 px-4 mt-6 flex flex-col gap-2">
        <SideNavLink href="/" icon={LayoutDashboard} label="Dashboard" exact />
        <SideNavLink href="/clientes" icon={Users} label="Client Hub" />
        <SideNavLink href="#" icon={LineChart} label="Investimentos" />
      </nav>

      <div className="p-4 mt-auto mb-4">
        <SideNavLink href="#" icon={Settings} label="Configurações" />
      </div>
    </aside>
  );
}
