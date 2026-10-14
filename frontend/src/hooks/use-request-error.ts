"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";

export function useRequestError() {
  const router = useRouter();
  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        router.replace("/login");
        router.refresh();
        return "Tu sesión expiró. Inicia sesión de nuevo";
      }
      return error instanceof Error
        ? error.message
        : "No se pudo completar la operación";
    },
    [router],
  );
}
