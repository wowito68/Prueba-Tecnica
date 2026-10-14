CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Libro" (
    "id" UUID NOT NULL,
    "isbn" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "anio_publicacion" INTEGER NOT NULL,
    "paginas" INTEGER NOT NULL,
    "sinopsis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Libro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

CREATE UNIQUE INDEX "Libro_isbn_key" ON "Libro"("isbn");

ALTER TABLE "Libro"
    ADD CONSTRAINT "Libro_isbn_not_empty" CHECK (length(btrim("isbn")) > 0),
    ADD CONSTRAINT "Libro_titulo_not_empty" CHECK (length(btrim("titulo")) > 0),
    ADD CONSTRAINT "Libro_autor_not_empty" CHECK (length(btrim("autor")) > 0),
    ADD CONSTRAINT "Libro_genero_not_empty" CHECK (length(btrim("genero")) > 0),
    ADD CONSTRAINT "Libro_paginas_positive" CHECK ("paginas" > 0),
    ADD CONSTRAINT "Libro_anio_publicacion_valid" CHECK ("anio_publicacion" <= EXTRACT(YEAR FROM CURRENT_DATE)::integer);
