import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AuthLayout } from "@/components/layout/auth-layout";

export default async function PublicAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await getSessionUser()) redirect("/catalogo");
  return (
    <AuthProvider initialUser={null}>
      <AuthLayout>{children}</AuthLayout>
    </AuthProvider>
  );
}
