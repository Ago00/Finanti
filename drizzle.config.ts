import { defineConfig } from 'drizzle-kit'
import { readFileSync } from 'fs'

// drizzle-kit doesn't load .env.local (that's Next.js only) — load it manually
try {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([^#=][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] ??= m[2].trim()
  }
} catch { /* file missing in CI — ignore */ }

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
