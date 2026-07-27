import { HubSidebar } from "@/components/layout/HubSidebar";
import { CurrentUserProvider } from "@/components/layout/CurrentUserProvider";
import { getCurrentUser, signedAvatarUrl } from "@/lib/dal";

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getCurrentUser() passa por verifySession() — sem sessão, redireciona a /login.
  const user = await getCurrentUser();
  const avatarUrl = await signedAvatarUrl(user?.avatar_path ?? null);

  return (
    <CurrentUserProvider user={user}>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <HubSidebar user={user} avatarUrl={avatarUrl} />
        {children}
      </div>
    </CurrentUserProvider>
  );
}
