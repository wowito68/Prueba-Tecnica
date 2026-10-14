import { prisma } from "../lib/prisma";

export const publicUserSelect = {
  id: true,
  nombre: true,
  email: true,
} as const;

export const userRepository = {
  findByEmail: (email: string) =>
    prisma.usuario.findUnique({ where: { email } }),
  findPublicById: (id: string) =>
    prisma.usuario.findUnique({ where: { id }, select: publicUserSelect }),
  create: (data: { nombre: string; email: string; passwordHash: string }) =>
    prisma.usuario.create({ data, select: publicUserSelect }),
};

export type PublicUser = NonNullable<
  Awaited<ReturnType<typeof userRepository.findPublicById>>
>;
