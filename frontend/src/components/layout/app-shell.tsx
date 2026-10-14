"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, authApi } from "@/lib/api";
import { useAuth } from "../auth/auth-provider";
import { Brand } from "../ui/brand";
import { Icon } from "../ui/icon";
import { Notice } from "../ui/notice";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await authApi.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          router.refresh();
        }
      }
    };
    const interval = setInterval(checkSession, 60000);
    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", checkSession);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, [router]);

  async function signOut() {
    setPending(true);
    setError("");
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo cerrar la sesión",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Cerrar navegación" : "Abrir navegación"}
            aria-expanded={menuOpen}
            aria-controls="sidebar-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} width="24" height="24" />
          </button>
        </div>
        <div
          id="sidebar-navigation"
          className={`sidebar-content ${menuOpen ? "is-open" : ""}`}
        >
          <nav aria-label="Navegación principal">
            <p className="nav-label">Nuestra biblioteca</p>
            <Link
              href="/catalogo"
              className="nav-link"
              aria-current={pathname.startsWith("/catalogo") ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="library" width="21" height="21" />
              Catálogo
            </Link>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-quote">
              <span aria-hidden="true">“</span>
              <p>
                Leer nos lleva lejos.
                <br />
                Compartir nos acerca.
              </p>
            </div>
            <div className="user-summary">
              <span className="user-avatar" aria-hidden="true">
                {user?.nombre.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{user?.nombre}</strong>
                <small>{user?.email}</small>
              </div>
            </div>
            <button
              className="logout-button"
              type="button"
              onClick={signOut}
              disabled={pending}
            >
              <Icon name="logout" width="19" height="19" />
              {pending ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <span>
            Biblioteca <span aria-hidden="true">/</span>{" "}
            <strong>Catálogo</strong>
          </span>
          <span className="club-badge">
            <span aria-hidden="true" />
            Club de lectura
          </span>
        </header>
        <main id="main-content" className="workspace-main">
          {error && <Notice>{error}</Notice>}
          {children}
        </main>
        <footer className="workspace-footer">
          Entre páginas. Un lugar para compartir lecturas.
        </footer>
      </div>
    </div>
  );
}
