"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="standalone-message">
      <h1>No pudimos cargar esta página.</h1>
      <p>Inténtalo de nuevo en unos momentos.</p>
      <Button onClick={reset}>Volver a intentar</Button>
      <Link href="/login">Ir al inicio de sesión</Link>
    </main>
  );
}
