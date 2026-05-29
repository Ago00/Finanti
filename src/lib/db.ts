import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined
}

const client =
  globalThis._pgClient ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    prepare: false,
    idle_timeout: 5,      // recycle before PgBouncer closes server-side
    max_lifetime: 60,     // force reconnect after 60s to prevent zombie connections
    connect_timeout: 10,
    connection: { statement_timeout: 30000 },
  })

if (process.env.NODE_ENV === 'development') globalThis._pgClient = client

export const db = drizzle(client, { schema })
