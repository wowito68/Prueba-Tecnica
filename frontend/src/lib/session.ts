import "server-only";
import { cookies } from "next/headers";
import type { User } from "./types";

export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get("club_session")?.value;
  if (!token) return null;
  const response = await fetch(
    `${process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000"}/auth/me`,
    {
      headers: { Cookie: `club_session=${encodeURIComponent(token)}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    },
  );
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("No se pudo verificar la sesión");
  const data: { user: User } = await response.json();
  return data.user;
}
