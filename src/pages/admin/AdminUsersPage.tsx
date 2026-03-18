import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../integrations/supabase/client";
import { backendRequest } from "../../lib/backend";
import { AppLayout } from "../../components/AppLayout";
import { Input } from "../../components/ui/input";
import { Loader2, Search, X, ArrowUpDown } from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Profile = Tables<"profiles">;

// Supabase auth.users has email — we join via a view or fetch separately
type UserRow = Profile & { email?: string };

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);

const KYC_STYLE: Record<string, string> = {
  approved: "bg-green-500/10  text-green-500   border border-green-500/20",
  pending:  "bg-amber-500/10  text-amber-500   border border-amber-500/20",
  rejected: "bg-red-500/10    text-red-500     border border-red-500/20",
};

const ROLE_STYLE: Record<string, string> = {
  client:  "bg-sky-500/10    text-sky-500    border border-sky-500/20",
  hustler: "bg-violet-500/10 text-violet-500 border border-violet-500/20",
  admin:   "bg-primary/10    text-primary    border border-primary/20",
};

type SortKey = "name_asc" | "name_desc" | "balance_desc" | "balance_asc" | "joined_desc" | "joined_asc";

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [kycFilter, setKycFilter]   = useState("all");
  const [sort, setSort]             = useState<SortKey>("joined_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        // Fetch emails from auth.users via admin RPC (if available) or leave blank
        // Since we don't have a dedicated view, we try to get emails from auth
        // using the admin API — fall back gracefully if not available
        let emailMap: Record<string, string> = {};
        try {
          const authUsers = await backendRequest<{ users?: { id: string; email?: string }[] }>(
            "/api/admin/supabase-users/?page=1&per_page=1000",
            { method: "GET" }
          );
          emailMap = Object.fromEntries((authUsers?.users ?? []).map(u => [u.id, u.email ?? ""]));
        } catch { /* backend admin endpoint not accessible — leave blank */ }

        setUsers((data ?? []).map(p => ({ ...p, email: emailMap[p.id] })));
        setLoading(false);
      });
  }, []);

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "joined_desc",   label: "Newest first"       },
    { value: "joined_asc",    label: "Oldest first"       },
    { value: "name_asc",      label: "Name A → Z"         },
    { value: "name_desc",     label: "Name Z → A"         },
    { value: "balance_desc",  label: "Balance: high → low" },
    { value: "balance_asc",   label: "Balance: low → high" },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = users.filter(u => {
      const roleOk = roleFilter === "all" || u.role === roleFilter;
      const kycOk  = kycFilter  === "all" || u.kyc_status === kycFilter;
      const searchOk = !q ||
        (u.full_name ?? "").toLowerCase().includes(q) ||
        (u.phone      ?? "").toLowerCase().includes(q) ||
        (u.email      ?? "").toLowerCase().includes(q) ||
        (u.id_number  ?? "").toLowerCase().includes(q);
      return roleOk && kycOk && searchOk;
    });

    list.sort((a, b) => {
      if (sort === "name_asc")      return (a.full_name ?? "").localeCompare(b.full_name ?? "");
      if (sort === "name_desc")     return (b.full_name ?? "").localeCompare(a.full_name ?? "");
      if (sort === "balance_desc")  return Number(b.balance ?? 0) - Number(a.balance ?? 0);
      if (sort === "balance_asc")   return Number(a.balance ?? 0) - Number(b.balance ?? 0);
      if (sort === "joined_asc")    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });

    return list;
  }, [users, search, roleFilter, kycFilter, sort]);

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  const activeFilters = (roleFilter !== "all" ? 1 : 0) + (kycFilter !== "all" ? 1 : 0);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto pb-10 animate-fade-in">
        <div className="pt-2 mb-6">
          <h1 className="text-3xl font-extrabold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} total · {filtered.length} shown</p>
        </div>

        {/* Search + sort */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-9 rounded-xl"
              placeholder="Search name, email, phone or ID number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_OPTIONS.find(s => s.value === sort)?.label}
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-48">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${sort === opt.value ? "text-primary font-medium" : "text-foreground"}`}
                    >{opt.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Role */}
          {["all","client","hustler","admin"].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize
                ${roleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
            >{r === "all" ? "All roles" : r}</button>
          ))}

          <div className="w-px bg-border self-stretch mx-1" />

          {/* KYC */}
          {["all","approved","pending","rejected"].map(k => (
            <button
              key={k}
              onClick={() => setKycFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors capitalize
                ${kycFilter === k ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
            >{k === "all" ? "All KYC" : k}</button>
          ))}

          {activeFilters > 0 && (
            <button onClick={() => { setRoleFilter("all"); setKycFilter("all"); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-1">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Name", "Phone", "Role", "KYC", "Balance", "Joined"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No users match your filters.</td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{u.full_name ?? "—"}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{u.id_number ?? ""}</p>
                    </td>
                    {/* <td className="px-4 py-3 text-muted-foreground text-xs">{u.email ?? "—"}</td> */}
                    <td className="px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      {u.role ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize ${ROLE_STYLE[u.role] ?? ""}`}>
                          {u.role}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.kyc_status ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize ${KYC_STYLE[u.kyc_status] ?? ""}`}>
                          {u.kyc_status}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground whitespace-nowrap">
                      {u.role === "admin" ? <span className="text-muted-foreground">N/A</span> : zar(Number(u.balance ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}



