import { notFound } from "next/navigation";
import { getClient } from "@/lib/planning-dal";
import { ClientSidebar } from "@/components/layout/ClientSidebar";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-slate-50 font-inter overflow-hidden">
      <ClientSidebar client={client} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
