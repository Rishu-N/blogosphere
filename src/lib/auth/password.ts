import bcrypt from "bcryptjs";

/**
 * Single-admin, no self-serve reset: the password hash lives only in
 * ADMIN_PASSWORD_HASH. Recovery from a lost password is "generate a new
 * hash, update the env var, restart" -- an accepted tradeoff for a
 * personal-blog owner account. See /context.md.
 */
export function verifyAdminPassword(candidate: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  try {
    return bcrypt.compareSync(candidate, hash);
  } catch {
    return false;
  }
}
