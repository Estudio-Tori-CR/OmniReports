// src/components/RoleGuard.tsx
"use client";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import type { Role } from "@/app/interfaces/Roles";

export default function ActionGuard({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { role } = useAppSelector((s) => s.user);

  const ok = (role as Role[]).some((r) => allowed.includes(r));
  if (!ok) return null;
  return <>{ok && children}</>;
}
