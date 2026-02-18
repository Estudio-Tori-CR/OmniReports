// src/types/roles.ts
export type Role = 'ADMIN' | 'DEVELOPER' | 'REPORTS' | string;

export const ROUTES_RULES: Array<{ pattern: RegExp; allowed: Role[] }> = [
  { pattern: /^\/pages\/reports(\/|$)/, allowed: ['ADMIN','DEVELOPER','REPORTS'] },
  { pattern: /^\/pages\/instances(\/|$)/, allowed: ['ADMIN','DEVELOPER'] },
  { pattern: /^\/pages\/users(\/|$)/, allowed: ['ADMIN'] }, // users SOLO admin
  { pattern: /^\/pages\/connections(\/|$)/, allowed: ['ADMIN','DEVELOPER'] },
];

export const canAccess = (pathname: string, roles: Role[]) => {
  const rule = ROUTES_RULES.find(r => r.pattern.test(pathname));
  if (!rule) return true; // rutas no mapeadas => públicas
  return roles.some(r => rule.allowed.includes(r));
};
