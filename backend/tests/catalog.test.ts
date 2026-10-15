import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { PrismaClient } from "@prisma/client";

const apiUrl = process.env.TEST_API_URL ?? "http://localhost:4000";
const origin = new URL(process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .origin;
const prisma = new PrismaClient({
  datasourceUrl:
    process.env.DATABASE_URL ??
    "postgresql://club_demo:solo_demo_local@localhost:5433/club_lectura?schema=public",
});

test("Búsqueda, géneros y paginación con PostgreSQL real", async (t) => {
  const token = `catalog-${randomUUID()}`;
  const email = `${token}@example.com`;
  const novel = `${token}-Novela`;
  const essay = `${token}-Ensayo`;
  let cookie = "";
  const fixtures = Array.from({ length: 26 }, (_, index) => ({
    id: randomUUID(),
    isbn: `${token}-${index}`,
    titulo: `${token} Historia ${String(index).padStart(2, "0")}`,
    autor: `${index % 2 ? "Ana María" : "Luis Ortega"} ${token}`,
    genero: index % 3 ? (index % 2 ? novel.toLowerCase() : novel) : essay,
    anio_publicacion: 2020,
    paginas: 100,
    sinopsis: null,
    created_at: new Date(
      index === 0 ? "2026-01-02T00:00:00Z" : "2026-01-01T00:00:00Z",
    ),
  }));
  async function list(
    params: Record<string, string | number> = {},
    authenticated = true,
  ) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    );
    return fetch(`${apiUrl}/books?${query}`, {
      headers: authenticated ? { Cookie: cookie } : {},
    });
  }
  async function result(params: Record<string, string | number> = {}) {
    const response = await list(params);
    assert.equal(response.status, 200);
    return response.json();
  }
  const sorted = [...fixtures].sort(
    (a, b) =>
      b.created_at.getTime() - a.created_at.getTime() ||
      a.id.localeCompare(b.id),
  );
  try {
    const registration = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: "Lector de búsquedas",
        email,
        password: "LecturaPrueba123!",
      }),
    });
    assert.equal(registration.status, 201);
    cookie = (registration.headers.get("set-cookie") ?? "").split(";")[0];
    await prisma.libro.createMany({ data: fixtures });

    await t.test("busca coincidencias parciales por título", async () => {
      const data = await result({ search: `${token} Historia 02` });
      assert.deepEqual(
        data.books.map((b: { id: string }) => b.id),
        [fixtures[2].id],
      );
    });
    await t.test("busca por autor y conserva espacios interiores", async () => {
      const data = await result({ search: `Ana María ${token}`, limit: 50 });
      assert.equal(data.pagination.total, 13);
      assert.ok(
        data.books.every((b: { autor: string }) =>
          b.autor.startsWith("Ana María"),
        ),
      );
    });
    await t.test(
      "ignora mayúsculas y recorta espacios exteriores",
      async () => {
        const data = await result({
          search: `  ${token.toUpperCase()} HISTORIA 02  `,
        });
        assert.equal(data.books[0].id, fixtures[2].id);
        assert.equal(data.pagination.total, 1);
      },
    );
    await t.test(
      "filtra género completo sin distinguir mayúsculas",
      async () => {
        const data = await result({
          genero: ` ${novel.toUpperCase()} `,
          limit: 50,
        });
        assert.equal(
          data.pagination.total,
          fixtures.filter((b) => b.genero.toLowerCase() === novel.toLowerCase())
            .length,
        );
        assert.equal(
          (await result({ genero: `${token}-Nove` })).pagination.total,
          0,
        );
      },
    );
    await t.test("combina búsqueda y género", async () => {
      const data = await result({
        search: `Ana María ${token}`,
        genero: novel,
        limit: 50,
      });
      assert.equal(
        data.pagination.total,
        fixtures.filter(
          (b) =>
            b.autor.startsWith("Ana María") &&
            b.genero.toLowerCase() === novel.toLowerCase(),
        ).length,
      );
    });
    await t.test("aplica página 1 y límite 12 por defecto", async () => {
      const data = await result({ search: token });
      assert.deepEqual(
        data.books.map((b: { id: string }) => b.id),
        sorted.slice(0, 12).map((b) => b.id),
      );
      assert.deepEqual(data.pagination, {
        page: 1,
        limit: 12,
        total: 26,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });
    await t.test("pagina desde PostgreSQL sin repetir registros", async () => {
      const second = await result({ search: token, page: 2 });
      const third = await result({ search: token, page: 3 });
      assert.deepEqual(
        second.books.map((b: { id: string }) => b.id),
        sorted.slice(12, 24).map((b) => b.id),
      );
      assert.deepEqual(
        third.books.map((b: { id: string }) => b.id),
        sorted.slice(24).map((b) => b.id),
      );
      assert.equal(third.pagination.total, 26);
      assert.equal(third.pagination.hasNextPage, false);
      assert.equal(third.pagination.hasPreviousPage, true);
    });
    await t.test("admite límites personalizados hasta 50", async () => {
      assert.equal(
        (await result({ search: token, limit: 5 })).pagination.totalPages,
        6,
      );
      assert.equal(
        (await result({ search: token, limit: 50 })).books.length,
        26,
      );
    });
    await t.test(
      "ordena por fecha descendente e ID ascendente en empates",
      async () => {
        const one = await result({ search: token, limit: 50 });
        const two = await result({ search: token, limit: 50 });
        assert.deepEqual(
          one.books.map((b: { id: string }) => b.id),
          sorted.map((b) => b.id),
        );
        assert.deepEqual(one.books, two.books);
      },
    );
    await t.test(
      "devuelve géneros globales únicos y alfabéticos incluso sin resultados",
      async () => {
        const data = await result({ search: `ausente-${token}` });
        const all = await prisma.libro.groupBy({
          by: ["genero"],
          orderBy: { genero: "asc" },
        });
        const expected = [
          ...new Map(
            all.map((b) => [b.genero.toLocaleLowerCase("es"), b.genero]),
          ).values(),
        ].sort((a, b) => a.localeCompare(b, "es"));
        assert.deepEqual(data.genres, expected);
        assert.ok(data.genres.includes(essay));
        assert.equal(
          data.genres.filter(
            (g: string) => g.toLowerCase() === novel.toLowerCase(),
          ).length,
          1,
        );
      },
    );
    await t.test(
      "sin coincidencias devuelve total y páginas cero",
      async () => {
        const data = await result({ search: `ausente-${token}` });
        assert.deepEqual(data.books, []);
        assert.deepEqual(data.pagination, {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      },
    );
    await t.test(
      "página posterior al final mantiene el contrato sin error",
      async () => {
        const data = await result({ search: token, page: 4 });
        assert.equal(data.books.length, 0);
        assert.equal(data.pagination.page, 4);
        assert.equal(data.pagination.totalPages, 3);
      },
    );
    await t.test("rechaza parámetros inválidos con 400", async () => {
      for (const params of [
        { page: 0 },
        { page: -1 },
        { page: 1.5 },
        { page: "abc" },
        { page: "" },
        { page: "1e2" },
        { page: "9007199254740993" },
        { page: 2147483647 },
        { limit: 0 },
        { limit: -1 },
        { limit: 1.5 },
        { limit: 51 },
        { limit: "abc" },
        { limit: "" },
        { search: "x".repeat(201) },
        { genero: "x".repeat(81) },
      ]) {
        assert.equal((await list(params)).status, 400, JSON.stringify(params));
      }
      for (const query of [
        "page=1&page=2",
        "search=a&search=b",
        "genero=a&genero=b",
        "limit=2&limit=3",
      ]) {
        assert.equal(
          (
            await fetch(`${apiUrl}/books?${query}`, {
              headers: { Cookie: cookie },
            })
          ).status,
          400,
        );
      }
    });
    await t.test(
      "mantiene 401 sin autenticación incluso con parámetros",
      async () => {
        assert.equal(
          (await list({ search: token, page: 2 }, false)).status,
          401,
        );
        assert.equal((await list({ page: 0 }, false)).status, 401);
      },
    );
    await t.test("interpreta comodines SQL como texto literal", async () => {
      await prisma.libro.update({
        where: { id: fixtures[0].id },
        data: {
          titulo: `${token} 100% valor_con_barra\\`,
          genero: `${token} 100%`,
        },
      });
      assert.equal(
        (await result({ search: `${token} 100%` })).pagination.total,
        1,
      );
      assert.equal(
        (await result({ search: "%" })).books.filter((b: { isbn: string }) =>
          b.isbn.startsWith(token),
        ).length,
        1,
      );
      assert.equal(
        (await result({ search: "_con_" })).books.filter(
          (b: { isbn: string }) => b.isbn.startsWith(token),
        ).length,
        1,
      );
      assert.equal(
        (await result({ search: "\\" })).books.filter((b: { isbn: string }) =>
          b.isbn.startsWith(token),
        ).length,
        1,
      );
      assert.equal(
        (await result({ genero: `${token} 100%` })).pagination.total,
        1,
      );
      assert.equal((await result({ genero: `${token}%` })).pagination.total, 0);
    });
    await t.test("editar y eliminar refrescan totales y géneros", async () => {
      await prisma.libro.update({
        where: { id: fixtures[1].id },
        data: {
          titulo: `fuera-${token}`,
          autor: "Otro autor",
          genero: `${token}-Nuevo`,
        },
      });
      assert.equal(
        (await result({ search: `${token} Historia` })).pagination.total,
        24,
      );
      assert.ok(
        (await result({ search: token })).genres.includes(`${token}-Nuevo`),
      );
      await prisma.libro.delete({ where: { id: fixtures[1].id } });
      assert.equal((await result({ search: token })).pagination.total, 25);
      assert.ok(
        !(await result({ search: token })).genres.includes(`${token}-Nuevo`),
      );
    });
  } finally {
    await prisma.libro.deleteMany({ where: { isbn: { startsWith: token } } });
    await prisma.usuario.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
