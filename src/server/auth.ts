import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { ObjectId } from 'mongodb'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { User } from '@/lib/types'
import { collections } from './db'
import type { UserDoc } from './documents'
import { isProduction } from './env'
import { forbidden, unauthorized } from './http'

export const SESSION_COOKIE = 'veltre_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const BCRYPT_COST = 12
const TIMING_HASH = '$2b$12$2HWM9f0/hutqOcLRzy.6A.1Q2p1einpxmf2xPLNlf6G10i5PtlonW'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST)

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  const ok = await bcrypt.compare(password, hash ?? TIMING_HASH)
  return hash !== null && ok
}

export async function createSession(userId: ObjectId) {
  const { sessions } = await collections()
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await sessions.insertOne({ _id: hashToken(token), userId, expiresAt, createdAt: new Date() })
  return { token, expiresAt }
}

export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

export const clearedSessionCookie = () => ({ ...sessionCookie('', new Date(0)), maxAge: 0 })

export async function userFromToken(token: string | undefined): Promise<UserDoc | null> {
  if (!token || token.length > 100) return null
  const { sessions, users } = await collections()
  const session = await sessions.findOne({ _id: hashToken(token) })
  if (!session || session.expiresAt.getTime() <= Date.now()) return null
  const user = await users.findOne({ _id: session.userId })
  if (!user || user.disabled) return null
  return user
}

export async function destroySession(token: string | undefined) {
  if (!token) return
  const { sessions } = await collections()
  await sessions.deleteOne({ _id: hashToken(token) })
}

export async function destroyOtherSessions(userId: ObjectId, keepToken: string | undefined) {
  const { sessions } = await collections()
  await sessions.deleteMany({ userId, ...(keepToken ? { _id: { $ne: hashToken(keepToken) } } : {}) })
}

export function toPublicUser(u: UserDoc): User {
  return { id: u._id.toHexString(), email: u.email, name: u.name, role: u.role, phone: u.phone, address: u.address }
}

export const getCurrentUserDoc = cache(async (): Promise<UserDoc | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return userFromToken(token)
})

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const doc = await getCurrentUserDoc()
  return doc ? toPublicUser(doc) : null
})

export async function requireUserPage(nextPath: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  return user
}

export async function requireAdminPage(): Promise<User> {
  const user = await requireUserPage('/admin')
  if (user.role !== 'admin') redirect('/')
  return user
}

export async function requireUser(req: NextRequest): Promise<UserDoc> {
  const user = await userFromToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!user) throw unauthorized()
  return user
}

export async function requireAdmin(req: NextRequest): Promise<UserDoc> {
  const user = await requireUser(req)
  if (user.role !== 'admin') throw forbidden()
  return user
}
