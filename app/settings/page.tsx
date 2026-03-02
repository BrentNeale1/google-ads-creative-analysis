import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Settings } from "lucide-react";

/** Force dynamic rendering -- data depends on DB */
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Server Action: update account primary KPI                          */
/* ------------------------------------------------------------------ */

async function updatePrimaryKpi(formData: FormData) {
  "use server";

  const accountId = formData.get("accountId") as string;
  const newKpi = formData.get("primaryKpi") as string;

  if (!accountId || !newKpi || (newKpi !== "cpa" && newKpi !== "roas")) {
    return;
  }

  await db
    .update(schema.accounts)
    .set({ primaryKpi: newKpi })
    .where(eq(schema.accounts.id, accountId));

  revalidatePath("/settings");
  revalidatePath("/rsa");
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getAccounts() {
  try {
    return await db
      .select({
        id: schema.accounts.id,
        displayName: schema.accounts.displayName,
        primaryKpi: schema.accounts.primaryKpi,
      })
      .from(schema.accounts)
      .orderBy(schema.accounts.displayName);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function SettingsPage() {
  const accounts = await getAccounts();

  return (
    <div className="max-w-2xl mx-auto pt-8 lg:pt-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-blue/10 text-brand-blue">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">
            Configure account preferences for creative analysis
          </p>
        </div>
      </div>

      {/* Account settings */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-surface-gridline p-6 text-center">
          <p className="text-sm text-gray-500">
            No accounts found. Connect an account to configure settings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-lg border border-surface-gridline p-6"
            >
              {/* Account name */}
              <div className="mb-4">
                <h2 className="text-sm font-medium text-gray-900">
                  {account.displayName}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{account.id}</p>
              </div>

              {/* KPI selector form */}
              <form action={updatePrimaryKpi}>
                <input type="hidden" name="accountId" value={account.id} />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary KPI
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Determines how creatives are ranked and classified into
                    performance tiers
                  </p>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryKpi"
                        value="cpa"
                        defaultChecked={account.primaryKpi === "cpa"}
                        className="text-brand-blue focus:ring-brand-blue/30"
                      />
                      <span className="text-sm text-gray-700">
                        CPA{" "}
                        <span className="text-xs text-gray-400">
                          (Cost Per Acquisition)
                        </span>
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="primaryKpi"
                        value="roas"
                        defaultChecked={account.primaryKpi === "roas"}
                        className="text-brand-blue focus:ring-brand-blue/30"
                      />
                      <span className="text-sm text-gray-700">
                        ROAS{" "}
                        <span className="text-xs text-gray-400">
                          (Return on Ad Spend)
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-colors"
                >
                  Save
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
