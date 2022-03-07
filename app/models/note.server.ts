import { prisma } from "~/db.server";

export function getNote({ userId, id }: { userId: string; id: string }) {
  return prisma.note.findFirst({
    where: { id, userId },
  });
}

export function getNoteListItems({ userId }: { userId: string }) {
  return prisma.note.findMany({
    where: { userId: userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createNote({
  title,
  body,
  userId,
}: {
  title: string;
  body: string;
  userId: string;
}) {
  return prisma.note.create({
    data: {
      title,
      body,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteNote({ id, userId }: { id: string; userId: string }) {
  return prisma.note.deleteMany({
    where: { id, userId },
  });
}

export type { Note } from "@prisma/client";
