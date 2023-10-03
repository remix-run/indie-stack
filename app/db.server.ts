import { remember } from "@epic-web/remember";
import { PrismaClient } from "@prisma/client";

// Hard-code a unique key, so we can look up the client when this module gets re-imported
const prisma = remember("prisma", () => new PrismaClient());
prisma.$connect();

export { prisma };
