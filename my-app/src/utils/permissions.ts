// src/utils/permissions.ts

export type Role =
  | "ADMIN"
  | "RESPONSABLEACADEMICO"
  | "EVALUADOR"
  | "ESTUDIANTE"
  | "TUTOR";

/** Puede crear/editar/eliminar competencias */
export function canManageCompetitions(role?: Role) {
  return role === "ADMIN" || role === "RESPONSABLEACADEMICO";
}

/** Puede administrar usuarios */
export function canManageUsers(role?: Role) {
  return role === "ADMIN";
}

export function isAdmin(role?: Role) {
  return role === "ADMIN";
}
export function isRespAcad(role?: Role) {
  return role === "RESPONSABLEACADEMICO";
}

/** Export default opcional (por compatibilidad si algun sitio hace `import perms from ...`) */
const permissions = {
  canManageCompetitions,
  canManageUsers,
  isAdmin,
  isRespAcad,
};
export default permissions;
