// src/types/roles.ts
export type Role = 'ADMIN' | 'DEVELOPER' | 'REPORTS' | string;

export const ROUTES_RULES: Array<{ pattern: RegExp; allowed: Role[] }> = [
  { pattern: /^\/views\/reports(\/|$)/, allowed: ['ADMIN','DEVELOPER','REPORTS'] },
  { pattern: /^\/views\/instances(\/|$)/, allowed: ['ADMIN','DEVELOPER'] },
  { pattern: /^\/views\/users(\/|$)/, allowed: ['ADMIN'] }, // users SOLO admin
  { pattern: /^\/views\/connections(\/|$)/, allowed: ['ADMIN','DEVELOPER'] },
];

export const canAccess = (pathname: string, roles: Role[]) => {
  const rule = ROUTES_RULES.find(r => r.pattern.test(pathname));
  if (!rule) return true; // rutas no mapeadas => públicas
  return roles.some(r => rule.allowed.includes(r));
};
