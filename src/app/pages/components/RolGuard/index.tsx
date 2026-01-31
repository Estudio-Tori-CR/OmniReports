// src/components/RoleGuard.tsx
"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/app/GlobalState/GlobalState";
import type { Role } from "@/app/interfaces/Roles";

export default function RoleGuard({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { role } = useAppSelector((s) => s.user);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    const ok = role.some((r: Role) => allowed.includes(r as Role));
    if (!ok) router.replace(`/403?next=${path}`);
  }, [role, allowed, router, path]);

  const ok = (role as Role[]).some((r) => allowed.includes(r));
  if (!ok) return null;
  return <>{children}</>;
}
