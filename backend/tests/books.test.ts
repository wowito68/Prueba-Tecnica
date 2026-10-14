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

test("CRUD autenticado de libros con PostgreSQL real", async (t) => {
  const suffix = randomUUID();
  const email = `books-test-${suffix}@example.com`;
  const isbn = `test-${suffix}`;
  const createdIds: string[] = [];
  let cookie = "";
  let id = "";
  const input = {
    isbn,
    titulo: "Lectura de integración",
    autor: "Autor de prueba",
    genero: "Novela",
    anio_publicacion: 2020,
    paginas: 180,
    sinopsis: "Una historia para verificar el catálogo.",
  };

  async function request(
    method: string,
    path: string,
    body?: unknown,
    authenticated = true,
  ) {
    return fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(authenticated ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }

  try {
    const registration = await request(
      "POST",
      "/auth/register",
      { nombre: "Lector de CRUD", email, password: "LecturaPrueba123!" },
      false,
    );
    assert.equal(registration.status, 201);
    cookie = (registration.headers.get("set-cookie") ?? "").split(";")[0];

    await t.test(
      "todos los endpoints rechazan peticiones sin sesión",
      async () => {
        const missing = randomUUID();
        for (const [method, path, body] of [
          ["GET", "/books", undefined],
          ["GET", `/books/${missing}`, undefined],
          ["POST", "/books", input],
          ["PUT", `/books/${missing}`, input],
          ["DELETE", `/books/${missing}`, undefined],
        ] as const) {
          assert.equal((await request(method, path, body, false)).status, 401);
        }
        assert.equal(
          (await request("GET", "/books", undefined, false)).headers.get(
            "cache-control",
          ),
          "no-store",
        );
      },
    );

    await t.test(
      "crea un libro con ID y fechas automáticas y lo persiste",
      async () => {
        const response = await request("POST", "/books", input);
        assert.equal(response.status, 201);
        const { book } = await response.json();
        id = book.id;
        createdIds.push(id);
        assert.match(id, /^[0-9a-f-]{36}$/i);
        assert.equal(response.headers.get("location"), `/books/${id}`);
        assert.ok(Number.isFinite(Date.parse(book.created_at)));
        assert.ok(Number.isFinite(Date.parse(book.updated_at)));
        const stored = await prisma.libro.findUniqueOrThrow({ where: { id } });
        assert.equal(stored.titulo, input.titulo);
        assert.equal(stored.isbn, isbn);
      },
    );

    await t.test("lista y consulta el libro guardado", async () => {
      const listing = await request("GET", "/books");
      assert.equal(listing.status, 200);
      assert.equal(listing.headers.get("cache-control"), "no-store");
      assert.ok(
        (await listing.json()).books.some(
          (book: { id: string }) => book.id === id,
        ),
      );
      const detail = await request("GET", `/books/${id}`);
      assert.equal(detail.status, 200);
      assert.equal((await detail.json()).book.sinopsis, input.sinopsis);
    });

    await t.test(
      "rechaza campos vacíos, tipos incorrectos, decimales y valores fuera de rango",
      async () => {
        for (const invalid of [
          { isbn: " " },
          { titulo: " " },
          { autor: "" },
          { genero: " " },
          { anio_publicacion: new Date().getFullYear() + 1 },
          { anio_publicacion: 2020.5 },
          { anio_publicacion: "2020" },
          { paginas: 0 },
          { paginas: -1 },
          { paginas: 1.5 },
          { paginas: 2147483648 },
          { paginas: null },
          { titulo: "a".repeat(201) },
          { sinopsis: "a".repeat(5001) },
          { id: randomUUID() },
        ]) {
          const response = await request("POST", "/books", {
            ...input,
            ...invalid,
          });
          assert.equal(response.status, 400, JSON.stringify(invalid));
          const body = await response.json();
          assert.ok(body.message && body.errors);
          assert.ok(!JSON.stringify(body).includes("Prisma"));
        }
        const { titulo, ...missingTitle } = input;
        assert.equal(
          (await request("POST", "/books", missingTitle)).status,
          400,
        );
        assert.equal(
          (await request("PUT", `/books/${id}`, { ...input, paginas: 0 }))
            .status,
          400,
        );
        assert.equal(
          (await prisma.libro.findUniqueOrThrow({ where: { id } })).paginas,
          input.paginas,
        );
      },
    );

    await t.test(
      "rechaza ISBN duplicados incluso en peticiones concurrentes",
      async () => {
        assert.equal((await request("POST", "/books", input)).status, 409);
        const concurrentInput = {
          ...input,
          isbn: `parallel-${suffix}`,
          sinopsis: null,
        };
        const responses = await Promise.all([
          request("POST", "/books", concurrentInput),
          request("POST", "/books", concurrentInput),
        ]);
        assert.deepEqual(
          responses.map((response) => response.status).sort(),
          [201, 409],
        );
        for (const response of responses) {
          if (response.status === 201)
            createdIds.push((await response.json()).book.id);
        }
        assert.equal(
          await prisma.libro.count({ where: { isbn: concurrentInput.isbn } }),
          1,
        );
      },
    );

    await t.test(
      "PostgreSQL aplica las restricciones sin depender de HTTP",
      async () => {
        await assert.rejects(prisma.libro.create({ data: input }), {
          code: "P2002",
        });
        await assert.rejects(
          prisma.libro.update({ where: { id }, data: { paginas: 0 } }),
        );
        await assert.rejects(
          prisma.libro.update({
            where: { id },
            data: { anio_publicacion: new Date().getFullYear() + 1 },
          }),
        );
      },
    );

    await t.test(
      "actualiza todos los campos conservando ID y fecha de creación",
      async () => {
        const previous = await prisma.libro.findUniqueOrThrow({
          where: { id },
        });
        const updatedInput = {
          ...input,
          isbn: `updated-${suffix}`,
          titulo: "Lectura actualizada",
          autor: "Otra autora",
          genero: "Ensayo",
          anio_publicacion: new Date().getFullYear(),
          paginas: 250,
          sinopsis: null,
        };
        const response = await request("PUT", `/books/${id}`, updatedInput);
        assert.equal(response.status, 200);
        const { book } = await response.json();
        assert.equal(book.id, id);
        assert.equal(book.created_at, previous.created_at.toISOString());
        assert.ok(Date.parse(book.updated_at) > previous.updated_at.getTime());
        const stored = await prisma.libro.findUniqueOrThrow({ where: { id } });
        for (const [key, value] of Object.entries(updatedInput))
          assert.equal(stored[key as keyof typeof stored], value);
        assert.equal(
          (
            await request("PUT", `/books/${id}`, {
              ...updatedInput,
              isbn: `parallel-${suffix}`,
            })
          ).status,
          409,
        );
        assert.equal(
          (await prisma.libro.findUniqueOrThrow({ where: { id } })).isbn,
          updatedInput.isbn,
        );
      },
    );

    await t.test(
      "acepta sinopsis opcional y devuelve null para texto vacío",
      async () => {
        const { sinopsis, ...withoutSynopsis } = input;
        const response = await request("POST", "/books", {
          ...withoutSynopsis,
          isbn: `optional-${suffix}`,
        });
        assert.equal(response.status, 201);
        const { book } = await response.json();
        createdIds.push(book.id);
        assert.equal(book.sinopsis, null);
        const updated = await request("PUT", `/books/${book.id}`, {
          ...withoutSynopsis,
          isbn: book.isbn,
          sinopsis: "   ",
        });
        assert.equal((await updated.json()).book.sinopsis, null);
      },
    );

    await t.test(
      "devuelve 400 para IDs inválidos y 404 para libros inexistentes",
      async () => {
        for (const method of ["GET", "PUT", "DELETE"]) {
          assert.equal(
            (
              await request(
                method,
                "/books/no-es-uuid",
                method === "PUT" ? input : undefined,
              )
            ).status,
            400,
          );
          const response = await request(
            method,
            `/books/${randomUUID()}`,
            method === "PUT" ? input : undefined,
          );
          assert.equal(response.status, 404);
          assert.deepEqual(await response.json(), {
            message: "Libro no encontrado",
          });
        }
      },
    );

    await t.test("elimina el libro de PostgreSQL y del listado", async () => {
      assert.equal((await request("DELETE", `/books/${id}`)).status, 204);
      assert.equal(await prisma.libro.findUnique({ where: { id } }), null);
      assert.equal((await request("GET", `/books/${id}`)).status, 404);
      assert.ok(
        !(await (await request("GET", "/books")).json()).books.some(
          (book: { id: string }) => book.id === id,
        ),
      );
    });
  } finally {
    await prisma.libro.deleteMany({
      where: {
        OR: [
          { id: { in: createdIds } },
          {
            isbn: {
              in: [
                isbn,
                `parallel-${suffix}`,
                `updated-${suffix}`,
                `optional-${suffix}`,
              ],
            },
          },
        ],
      },
    });
    await prisma.usuario.deleteMany({ where: { email } });
    await prisma.$disconnect();
  }
});
