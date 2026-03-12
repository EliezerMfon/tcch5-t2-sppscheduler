import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  engine: "classic",

  migrations: {
    path: "prisma/migrations",
    // ✅ optional seed script
    seed: "ts-node prisma/seed.ts",  
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});