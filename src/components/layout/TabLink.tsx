"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabLinkProps {
  href: string;
  label: string;
}

export function TabLink({ href, label }: TabLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={
        isActive
          ? "border-b-2 border-brand-600 text-brand-600 font-medium pb-3 transition-colors"
          : "border-b-2 border-transparent text-slate-500 hover:text-brand-950 pb-3 transition-colors"
      }
    >
      {label}
    </Link>
  );
}
