// Shared, fail-closed admin gate.
//
// The client sends the signed-in email in the `x-admin-email` header. If
// NEXT_PUBLIC_ADMIN_EMAIL is not configured we deny by default (the previous
// behaviour returned true, which effectively disabled the gate).

export function isAdminEmail(email: string | null | undefined): boolean {
  const required = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!required) return false;
  return typeof email === "string" && email.length > 0 && email === required;
}

export function requireAdmin(req: Request): boolean {
  return isAdminEmail(req.headers.get("x-admin-email"));
}
