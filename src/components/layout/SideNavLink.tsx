"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface SideNavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

export function SideNavLink({ href, icon: Icon, label, exact = false }: SideNavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={
        isActive
          ? "flex items-center gap-3 px-4 py-3 bg-brand-600 text-white border-l-4 border-white rounded-r-lg transition-colors"
          : "flex items-center gap-3 px-4 py-3 text-brand-300 hover:bg-brand-600/50 hover:text-white rounded-lg transition-colors border-l-4 border-transparent"
      }
    >
      <Icon className="w-5 h-5" />
      <span className={`font-inter text-sm ${isActive ? "font-medium" : ""}`}>{label}</span>
    </Link>
  );
}
