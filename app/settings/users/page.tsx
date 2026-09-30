"use client";

import { useEffect, useState } from "react";
import { UserPlus, ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ToastViewport, useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface DashboardUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
}

export default function ManageUsersPage() {
  const { toast, showToast } = useToast();
  const [users, setUsers] = useState<DashboardUser[] | null>(null);
  const [authorized, setAuthorized] = useState(true);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadUsers() {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await client.rpc("list_dashboard_users");
    if (error) {
      setAuthorized(false);
      setUsers(null);
    } else {
      setAuthorized(true);
      setUsers(data as DashboardUser[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load on mount is intentional here
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setCreating(true);
    const { error } = await client.rpc("admin_create_dashboard_user", {
      user_email: email.trim(),
      user_password: password,
    });
    setCreating(false);

    if (error) {
      showToast(error.message || "Couldn't create that user", "error");
      return;
    }

    showToast(`${email} can now sign in`);
    setEmail("");
    setPassword("");
    loadUsers();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
      <PageHeader title="Manage users" subtitle="Everyone with these credentials can see all venues' private data." />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </div>
      ) : !authorized ? (
        <div className="rounded-xl border border-border bg-white p-6 text-sm text-ink-soft">
          Your account isn&apos;t authorized to manage dashboard users.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="border-b border-border px-5 py-3 text-sm font-semibold text-ink">Who has access</div>
            <div className="divide-y divide-border">
              {users?.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{u.email}</p>
                    <p className="text-xs text-ink-soft">
                      Added {new Date(u.created_at).toLocaleDateString("en-AU")}
                      {u.last_sign_in_at ? ` · last signed in ${new Date(u.last_sign_in_at).toLocaleDateString("en-AU")}` : " · never signed in"}
                    </p>
                  </div>
                  {u.is_admin && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreate} className="rounded-xl border border-border bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold text-ink">Add a user</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="email"
                required
                placeholder="name@whpgroup.com.au"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
              <input
                type="text"
                required
                minLength={6}
                placeholder="Temporary password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={creating}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                Add
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">
              They can sign in immediately with this email and password. Share it with them directly — there&apos;s no
              invite email sent.
            </p>
          </form>
        </div>
      )}

      <ToastViewport toast={toast} />
    </div>
  );
}
