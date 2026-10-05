// Shared, fail-closed admin gate.
//
// Identity arrives in the `x-admin-email` header. That is an assertion by the
// browser, not a verified token, so the gate decides *which* signed-in UI gets
// which capability — it is not a defence against someone hand-crafting a curl
// request. Moving to verified Firebase ID tokens is a separate change.
//
// Roles:
//   admin        — dashboard, products, orders, refunds.
//   super admin  — everything an admin can do, plus the bulk XLSX catalog
//                  upload (POST /api/admin/products/sync, full-replace sync).
//
// Configuration (all NEXT_PUBLIC_ so the dashboard can hide what a role cannot
// use; changing them needs a redeploy, because client bundles inline them):
//   NEXT_PUBLIC_ADMIN_EMAILS        comma-separated admins (optional)
//   NEXT_PUBLIC_SUPER_ADMIN_EMAILS  comma-separated super admins (optional)
//   NEXT_PUBLIC_ADMIN_EMAIL         legacy single admin; counts as an admin and,
//                                   while no explicit super list is set, as the
//                                   super admin — so a single-admin deployment
//                                   keeps the bulk upload instead of losing it
//                                   on upgrade.
//
// Nothing configured => nobody is an admin (the previous behaviour returned
// true, which effectively disabled the gate).

const ADMIN_ENV = "NEXT_PUBLIC_ADMIN_EMAIL";
const ADMINS_ENV = "NEXT_PUBLIC_ADMIN_EMAILS";
const SUPER_ADMINS_ENV = "NEXT_PUBLIC_SUPER_ADMIN_EMAILS";

function parseEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Bulk-upload holders. An explicit super list wins; the legacy single admin is the fallback. */
export function superAdminEmails(): string[] {
  const explicit = parseEmails(process.env[SUPER_ADMINS_ENV]);
  if (explicit.length) return explicit;
  return parseEmails(process.env[ADMIN_ENV]);
}

/** Everyone allowed into the dashboard. A super admin is always an admin. */
export function adminEmails(): string[] {
  return Array.from(
    new Set([
      ...parseEmails(process.env[ADMINS_ENV]),
      ...parseEmails(process.env[ADMIN_ENV]),
      ...superAdminEmails(),
    ])
  );
}

function matches(list: string[], email: string | null | undefined): boolean {
  return (
    typeof email === "string" &&
    email.length > 0 &&
    list.includes(email.trim().toLowerCase())
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return matches(adminEmails(), email);
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return matches(superAdminEmails(), email);
}

export function requireAdmin(req: Request): boolean {
  return isAdminEmail(req.headers.get("x-admin-email"));
}

/** Gate for the bulk XLSX catalog upload. */
export function requireSuperAdmin(req: Request): boolean {
  return isSuperAdminEmail(req.headers.get("x-admin-email"));
}
