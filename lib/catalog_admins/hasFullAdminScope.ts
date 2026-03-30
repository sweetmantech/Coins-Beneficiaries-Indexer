import { AUTH_SCOPE_OWNER, AUTH_SCOPE_ARTIST } from "@/lib/consts";

// Only track admins with OWNER or ARTIST scope (required for all three: URI, airdrop, mint config).
// Pure MANAGER (4) cannot airdrop. authScope=0 (removal) is always tracked.
export function hasFullAdminScope(authScope: number): boolean {
  return authScope === 0 || (authScope & (AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST)) !== 0;
}
