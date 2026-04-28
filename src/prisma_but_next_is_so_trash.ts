import 'server-only'
import path from 'node:path'
import url from 'node:url'
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

const adapter = new PrismaBetterSqlite3({
    url: 'file:' + path.join(url.fileURLToPath(import.meta.url), '..', '..', 'sqlite.db'),
});
const prisma = new PrismaClient({ adapter });

export * from '../generated/prisma/client.ts'
export { prisma };
