import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

// 1. Criamos a piscina de conexões usando o pg
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Agora sim, ligamos o Prisma passando o pg para ele!
const prisma = new PrismaClient({ adapter });

export default prisma;