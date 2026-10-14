"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { useAuth } from "./auth-provider";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Icon } from "../ui/icon";
import { Notice } from "../ui/notice";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const auth = useAuth();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const field = ["nombre", "email", "password"].find((name) => errors[name]);
    if (!pending && field) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
    }
  }, [errors, pending]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    setErrors({});
    const data = new FormData(event.currentTarget);
    const input = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      ...(isRegister
        ? { nombre: String(data.get("nombre") ?? "").trim() }
        : {}),
    };
    if (new TextEncoder().encode(input.password).length > 72) {
      setErrors({ password: "La contraseña no puede superar 72 bytes" });
      return;
    }
    setPending(true);
    try {
      await (isRegister ? auth.register(input) : auth.login(input));
      router.replace("/catalogo");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo completar la petición",
      );
      if (error instanceof ApiError) {
        setErrors(error.errors);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-form-heading">
        <h1>
          {isRegister
            ? "Tu próxima historia empieza aquí."
            : "Qué bueno volver a leerte."}
        </h1>
        <p>
          {isRegister
            ? "Crea tu cuenta y forma parte de nuestro club de lectura."
            : "Inicia sesión para entrar al catálogo del club."}
        </p>
      </div>
      <form ref={formRef} onSubmit={submit} aria-busy={pending}>
        {message && <Notice>{message}</Notice>}
        <fieldset disabled={pending} className="auth-fields">
          {isRegister && (
            <Field
              id="nombre"
              name="nombre"
              label="Nombre"
              placeholder="Cómo te llamas"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              error={errors.nombre}
            />
          )}
          <Field
            id="email"
            name="email"
            type="email"
            label="Correo electrónico"
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            maxLength={254}
            error={errors.email}
          />
          <Field
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            label="Contraseña"
            placeholder={isRegister ? "Crea una contraseña" : "Tu contraseña"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={8}
            maxLength={72}
            error={errors.password}
            hint={
              isRegister ? "Al menos 8 caracteres. Máximo 72 bytes." : undefined
            }
            className="password-input"
          >
            <button
              type="button"
              className="password-toggle"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                width="20"
                height="20"
              />
            </button>
          </Field>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Un momento…"
              : isRegister
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Button>
        </fieldset>
        <span className="sr-only" role="status" aria-live="polite">
          {pending ? "Verificando tus datos" : ""}
        </span>
      </form>
      <p className="auth-alternative">
        {isRegister ? "¿Ya tienes una cuenta?" : "¿Primera vez por aquí?"}{" "}
        <Link href={isRegister ? "/login" : "/registro"}>
          {isRegister ? "Inicia sesión" : "Crea tu cuenta"}
        </Link>
      </p>
      <p className="auth-footer-note">
        Un espacio para quienes disfrutan una buena historia.
      </p>
    </div>
  );
}
