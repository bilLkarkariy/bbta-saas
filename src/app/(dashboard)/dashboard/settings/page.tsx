import { getCurrentTenant } from "@/lib/auth";

export default async function SettingsPage() {
  const { tenant } = await getCurrentTenant();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-gray-500">Configurez votre compte et vos intégrations</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">Informations du compte</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nom du business</dt>
              <dd className="mt-1">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Slug</dt>
              <dd className="mt-1 font-mono text-sm">{tenant.slug}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type de business</dt>
              <dd className="mt-1 capitalize">{tenant.businessType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Plan</dt>
              <dd className="mt-1 capitalize">{tenant.plan}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {tenant.status}
                </span>
                {tenant.trialEndsAt && (
                  <span className="ml-2 text-sm text-gray-500">
                    (expire le{" "}
                    {new Date(tenant.trialEndsAt).toLocaleDateString("fr-FR")})
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">WhatsApp</h3>
          {tenant.whatsappNumber ? (
            <div>
              <p className="text-sm text-gray-500">Numéro connecté</p>
              <p className="font-mono mt-1">{tenant.whatsappNumber}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">
                Aucun numéro WhatsApp connecté
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                Connecter WhatsApp
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h3 className="font-semibold mb-4">Zone dangereuse</h3>
          <p className="text-sm text-gray-500 mb-4">
            Ces actions sont irréversibles. Soyez prudent.
          </p>
          <button className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            Supprimer le compte
          </button>
        </div>
      </div>
    </div>
  );
}
