"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api";
import type { AuthInput, User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  login: (input: AuthInput) => Promise<void>;
  register: (input: AuthInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState(initialUser);
  return (
    <AuthContext.Provider
      value={{
        user,
        login: async (input) => setUser((await authApi.login(input)).user),
        register: async (input) =>
          setUser((await authApi.register(input)).user),
        logout: async () => {
          await authApi.logout();
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("El contexto de autenticación no está disponible");
  return context;
}
