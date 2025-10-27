// src/utils/permissions.ts
export type Permissions = {
  navbar?: Record<string, boolean>;
  competitions?: Partial<Record<"read"|"create"|"update"|"delete", boolean>>;
  users?: Partial<Record<"read"|"create"|"update"|"delete", boolean>>;
  inscriptions?: Partial<Record<"read"|"create"|"delete", boolean>>; // NUEVO: agregar inscriptions
};

export function isAdmin(roleSlug?: string) {
  return roleSlug === "ADMIN";
}

export function isEstudiante(roleSlug?: string) {
  return roleSlug === "ESTUDIANTE";
}

export function isTutor(roleSlug?: string) {
  return roleSlug === "TUTOR";
}

export function canManageCompetitions(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.competitions?.create || perms?.competitions?.update || perms?.competitions?.delete);
}

export function canReadUsers(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.users?.read);
}

export function canCreateInscriptions(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.inscriptions?.create);
}

export function canReadInscriptions(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.inscriptions?.read);
}

export function canDeleteInscriptions(roleSlug?: string, perms?: Permissions | null) {
  if (isAdmin(roleSlug)) return true;
  return Boolean(perms?.inscriptions?.delete);
}

export function canInscribirse(roleSlug?: string, perms?: Permissions | null, tieneTutor?: boolean) {
  if (!canCreateInscriptions(roleSlug, perms)) return false;
  
  if (isEstudiante(roleSlug)) {
    return tieneTutor === true;
  }
  
  return true;
}

export function getPermissions() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ohsansi_perms");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function shouldShowTutoresButton(roleSlug?: string, tieneTutor?: boolean) {
  return isEstudiante(roleSlug) && !tieneTutor;
}