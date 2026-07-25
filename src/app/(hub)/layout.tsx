import { HubSidebar } from "@/components/layout/HubSidebar";
import { getCurrentUser } from "@/lib/dal";

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getCurrentUser() passa por verifySession() — sem sessão, redireciona a /login.
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <HubSidebar user={user} />
      {children}
    </div>
  );
}
