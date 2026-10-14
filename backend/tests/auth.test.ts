import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const apiUrl = process.env.TEST_API_URL ?? "http://localhost:4000";
const origin = new URL(process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .origin;
const secret =
  process.env.JWT_SECRET ?? "solo-demo-local-cambiar-antes-de-produccion-2026";
const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL ??
    "postgresql://club_demo:solo_demo_local@localhost:5433/club_lectura?schema=public",
});

function post(path: string, data: unknown, cookie?: string) {
  return fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(data),
  });
}

test("Autenticación completa con servicios Docker y PostgreSQL", async (t) => {
  const email = `auth-test-${randomUUID()}@example.com`;
  const password = "LecturaPrueba123!";
  let cookie = "";
  let userId = "";
  try {
    await t.test("rechaza sesiones ausentes y manipuladas", async () => {
      assert.equal((await fetch(`${apiUrl}/auth/me`)).status, 401);
      assert.equal(
        (
          await fetch(`${apiUrl}/auth/me`, {
            headers: { Cookie: "club_session=invalid" },
          })
        ).status,
        401,
      );
    });

    await t.test(
      "permite CORS con credenciales desde el frontend",
      async () => {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "OPTIONS",
          headers: {
            Origin: origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
          },
        });
        assert.equal(response.status, 204);
        assert.equal(
          response.headers.get("access-control-allow-origin"),
          origin,
        );
        assert.equal(
          response.headers.get("access-control-allow-credentials"),
          "true",
        );
      },
    );

    await t.test("bloquea escrituras desde otro origen", async () => {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: { Origin: "https://otro-origen.example" },
      });
      assert.equal(response.status, 403);
      assert.equal(
        (await fetch(`${apiUrl}/auth/logout`, { method: "POST" })).status,
        403,
      );
    });

    await t.test("valida campos y el límite bcrypt en bytes", async () => {
      const response = await post("/auth/register", {
        nombre: "A",
        email: "invalido",
        password: "123",
      });
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.ok(
        body.errors.nombre && body.errors.email && body.errors.password,
      );
      assert.equal(
        (
          await post("/auth/register", {
            nombre: "Lector",
            email,
            password: "á".repeat(37),
          })
        ).status,
        400,
      );
      const malformed = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin },
        body: "{",
      });
      assert.equal(malformed.status, 400);
      assert.match(malformed.headers.get("content-type") ?? "", /json/);
    });

    await t.test("registra una cuenta y crea una cookie HttpOnly", async () => {
      const response = await post("/auth/register", {
        nombre: "Lector de integración",
        email: email.toUpperCase(),
        password,
      });
      assert.equal(response.status, 201);
      const body = await response.json();
      userId = body.user.id;
      assert.equal(body.user.email, email);
      assert.deepEqual(Object.keys(body.user).sort(), [
        "email",
        "id",
        "nombre",
      ]);
      const setCookie = response.headers.get("set-cookie") ?? "";
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /SameSite=Lax/i);
      assert.match(setCookie, /Path=\//);
      assert.match(setCookie, /Max-Age=/);
      cookie = setCookie.split(";")[0];
      const stored = await prisma.usuario.findUniqueOrThrow({
        where: { email },
      });
      assert.notEqual(stored.passwordHash, password);
      assert.ok(await bcrypt.compare(password, stored.passwordHash));
    });

    await t.test("consulta solo los datos públicos de la sesión", async () => {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Cookie: cookie },
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(Object.keys((await response.json()).user).sort(), [
        "email",
        "id",
        "nombre",
      ]);
    });

    await t.test(
      "detecta correos duplicados sin distinguir mayúsculas",
      async () => {
        assert.equal(
          (
            await post("/auth/register", {
              nombre: "Otro lector",
              email: email.toUpperCase(),
              password,
            })
          ).status,
          409,
        );
      },
    );

    await t.test(
      "rechaza credenciales incorrectas sin revelar cuentas",
      async () => {
        const incorrect = await post("/auth/login", {
          email,
          password: "Incorrecta123!",
        });
        const unknown = await post("/auth/login", {
          email: `missing-${randomUUID()}@example.com`,
          password,
        });
        assert.equal(incorrect.status, 401);
        assert.equal(unknown.status, 401);
        assert.equal(
          (await incorrect.json()).message,
          (await unknown.json()).message,
        );
        assert.equal(incorrect.headers.get("set-cookie"), null);
      },
    );

    await t.test("inicia sesión con la cuenta registrada", async () => {
      const response = await post("/auth/login", { email, password });
      assert.equal(response.status, 200);
      cookie = (response.headers.get("set-cookie") ?? "").split(";")[0];
      assert.equal((await response.json()).user.id, userId);
    });

    await t.test("rechaza JWT expirados y firmas ajenas", async () => {
      for (const token of [
        jwt.sign({}, secret, {
          subject: userId,
          issuer: "club-lectura",
          audience: "club-lectura-web",
          expiresIn: -1,
        }),
        jwt.sign({}, "otra-firma-que-no-pertenece-a-la-aplicacion", {
          subject: userId,
          issuer: "club-lectura",
          audience: "club-lectura-web",
          expiresIn: 60,
        }),
      ]) {
        assert.equal(
          (
            await fetch(`${apiUrl}/auth/me`, {
              headers: { Cookie: `club_session=${token}` },
            })
          ).status,
          401,
        );
      }
    });

    await t.test(
      "protege el catálogo también desde el servidor Next.js",
      async () => {
        const anonymous = await fetch(`${origin}/catalogo`, {
          redirect: "manual",
        });
        assert.equal(anonymous.status, 307);
        assert.equal(
          new URL(anonymous.headers.get("location")!, origin).pathname,
          "/login",
        );
        const authenticated = await fetch(`${origin}/catalogo`, {
          headers: { Cookie: cookie },
        });
        assert.equal(authenticated.status, 200);
        const html = await authenticated.text();
        assert.match(html, /Agregar libro/);
        assert.match(html, /Lector de integración/);
        assert.ok(!html.includes(password));
      },
    );

    await t.test("elimina la cookie al cerrar sesión", async () => {
      const response = await post("/auth/logout", {}, cookie);
      assert.equal(response.status, 204);
      assert.match(response.headers.get("set-cookie") ?? "", /club_session=;/);
      assert.match(
        response.headers.get("set-cookie") ?? "",
        /Expires=Thu, 01 Jan 1970/,
      );
      assert.equal((await fetch(`${apiUrl}/auth/me`)).status, 401);
    });
  } finally {
    await prisma.usuario.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
