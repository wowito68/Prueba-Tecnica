import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Iniciar sesión | Entre páginas" };
export default function LoginPage() {
  return <AuthForm mode="login" />;
}
