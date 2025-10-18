// src/utils/permissions.ts
export type Permissions = {
  navbar?: Record<string, boolean>;
  competitions?: Partial<Record<"read"|"create"|"update"|"delete", boolean>>;
  users?: Partial<Record<"read"|"create"|"update"|"delete", boolean>>;
};

export function isAdmin(roleSlug?: string) {
  return roleSlug === "ADMIN";
}

export function canManageCompetitions(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.competitions?.create || perms?.competitions?.update || perms?.competitions?.delete);
}

export function canReadUsers(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.users?.read);
}
