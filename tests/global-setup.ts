import { existsSync } from 'node:fs'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import type { TestProject } from 'vitest/node'

let server: MongoMemoryServer | undefined

export async function setup(project: TestProject) {
  const systemBinary = process.env.MONGOMS_SYSTEM_BINARY ?? (existsSync('/usr/bin/mongod') ? '/usr/bin/mongod' : undefined)
  server = await MongoMemoryServer.create({ binary: systemBinary ? { systemBinary } : undefined })
  project.provide('mongoUri', server.getUri())
}

export async function teardown() {
  await server?.stop()
}

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string
  }
}
