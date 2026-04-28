import path from 'node:path'
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

const adapter = new PrismaBetterSqlite3({
    url: 'file:' + path.join(import.meta.dirname, '..', 'sqlite.db'),
});
const prisma = new PrismaClient({ adapter });

export * from '../generated/prisma/client.ts'
export { prisma };
