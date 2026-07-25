import type { Metadata } from "next";
import { getCurrentUser, getOrganization, listOrgUsers } from "@/lib/dal";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { OrganizationForm } from "@/components/settings/OrganizationForm";
import { UsersTable } from "@/components/settings/UsersTable";
import { ROLE_LABEL } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Configurações — HFC Hub",
};

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h2 className="font-poppins font-medium text-lg text-brand-950">
        {title}
      </h2>
      <p className="font-inter text-sm text-slate-500 mt-1 mb-6">{description}</p>
      {children}
    </section>
  );
}

export default async function ConfiguracoesPage() {
  const [user, org, users] = await Promise.all([
    getCurrentUser(),
    getOrganization(),
    listOrgUsers(),
  ]);

  const isAdmin = user?.role === "admin";

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="mb-8">
        <h1 className="font-poppins font-medium text-3xl text-brand-950">
          Configurações
        </h1>
      </header>

      <div className="flex flex-col gap-6 max-w-3xl">
        <Card
          title="Perfil"
          description="Seus dados nesta organização. O e-mail e o papel são geridos por um administrador."
        >
          <div className="flex flex-col gap-6">
            <ProfileForm nome={user?.nome ?? null} />
            <dl className="grid grid-cols-2 gap-4 max-w-md pt-2 border-t border-slate-100">
              <div>
                <dt className="font-inter text-xs text-slate-500">E-mail</dt>
                <dd className="font-inter text-sm text-slate-800 mt-0.5 truncate">
                  {user?.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="font-inter text-xs text-slate-500">Papel</dt>
                <dd className="font-inter text-sm text-slate-800 mt-0.5">
                  {user ? ROLE_LABEL[user.role] : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card
          title="Organização"
          description={
            isAdmin
              ? "Dados da consultoria. Só administradores podem alterar."
              : "Dados da consultoria. Alteração restrita a administradores."
          }
        >
          {org ? (
            isAdmin ? (
              <OrganizationForm name={org.name} plano={org.plano} />
            ) : (
              <dl className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <dt className="font-inter text-xs text-slate-500">Nome</dt>
                  <dd className="font-inter text-sm text-slate-800 mt-0.5">
                    {org.name}
                  </dd>
                </div>
                <div>
                  <dt className="font-inter text-xs text-slate-500">Plano</dt>
                  <dd className="font-inter text-sm text-slate-800 mt-0.5">
                    {org.plano ?? "—"}
                  </dd>
                </div>
              </dl>
            )
          ) : (
            <p className="font-inter text-sm text-slate-500">
              Organização não encontrada.
            </p>
          )}
        </Card>

        <Card
          title="Usuários"
          description={
            isAdmin
              ? "Membros da organização e seus papéis."
              : "Membros da organização. Só administradores alteram papéis."
          }
        >
          {users.length > 0 ? (
            <UsersTable
              users={users}
              currentUserId={user?.id ?? ""}
              canEdit={isAdmin}
            />
          ) : (
            <p className="font-inter text-sm text-slate-500">
              Nenhum usuário encontrado.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
