import 'server-only'
import { MongoClient, type Db } from 'mongodb'
import type {
  CartDoc,
  CategoryDoc,
  ImageDoc,
  OrderDoc,
  ProductDoc,
  RateLimitDoc,
  SessionDoc,
  SettingsDoc,
  UserDoc,
} from './documents'
import { env } from './env'

const globalMongo = globalThis as unknown as {
  _mongoClient?: Promise<MongoClient>
  _mongoIndexes?: Promise<void>
}

function client(): Promise<MongoClient> {
  if (!globalMongo._mongoClient) {
    globalMongo._mongoClient = new MongoClient(env().MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      appName: 'veltre-store',
    })
      .connect()
      .catch((err) => {
        globalMongo._mongoClient = undefined
        throw err
      })
  }
  return globalMongo._mongoClient
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('sessions').createIndex({ userId: 1 }),
    db.collection('products').createIndex({ slug: 1 }, { unique: true }),
    db.collection('products').createIndex({ status: 1, categoryId: 1, createdAt: -1 }),
    db.collection('categories').createIndex({ slug: 1 }, { unique: true }),
    db.collection('orders').createIndex({ number: 1 }, { unique: true }),
    db.collection('orders').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ status: 1, createdAt: -1 }),
    db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ])
}

export async function getDb(): Promise<Db> {
  const db = (await client()).db(env().MONGODB_DB)
  if (!globalMongo._mongoIndexes) {
    globalMongo._mongoIndexes = ensureIndexes(db).catch((err) => {
      globalMongo._mongoIndexes = undefined
      throw err
    })
  }
  await globalMongo._mongoIndexes
  return db
}

export async function collections() {
  const db = await getDb()
  return {
    users: db.collection<UserDoc>('users'),
    sessions: db.collection<SessionDoc>('sessions'),
    images: db.collection<ImageDoc>('images'),
    categories: db.collection<CategoryDoc>('categories'),
    products: db.collection<ProductDoc>('products'),
    carts: db.collection<CartDoc>('carts'),
    orders: db.collection<OrderDoc>('orders'),
    settings: db.collection<SettingsDoc>('settings'),
    rateLimits: db.collection<RateLimitDoc>('rate_limits'),
  }
}

export async function closeDb() {
  if (globalMongo._mongoClient) {
    const c = await globalMongo._mongoClient
    await c.close()
  }
  globalMongo._mongoClient = undefined
  globalMongo._mongoIndexes = undefined
}
