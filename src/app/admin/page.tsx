import { redirect } from "next/navigation";
import { ShieldCheck, ShieldX } from "lucide-react";
import { AdminRegistrationsTable } from "@/components/admin/admin-registrations-table";
import { listAdminRegistrations } from "@/services/admin-service";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?redirect=/admin&tab=sign-in");

  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-24 text-center sm:px-6 lg:px-8">
        <ShieldX className="size-10 text-impact" aria-hidden />
        <h1 className="text-2xl text-navy">Not Authorized</h1>
        <p className="text-sm text-muted-foreground">
          {user.email} doesn&apos;t have admin access to For The Kids Athletics.
        </p>
      </div>
    );
  }

  const rows = await listAdminRegistrations();

  return (
    <div className="bg-background">
      <div className="bg-navy py-10 sm:py-12">
        <div className="mx-auto w-[95%] max-w-[1600px]">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-carolina">
            <ShieldCheck className="size-4" aria-hidden />
            View-Only Admin
          </div>
          <h1 className="mt-2 text-4xl text-white sm:text-5xl">Registrations</h1>
          <p className="mt-2 max-w-lg text-white/70">
            View, search, and export registrations, participant details, and payment information in one place.
          </p>
        </div>
      </div>

      <div className="mx-auto w-[95%] max-w-[1600px] py-10">
        {rows.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No registrations yet.
          </div>
        ) : (
          <AdminRegistrationsTable rows={rows} />
        )}
      </div>
    </div>
  );
}
