import 'server-only'
import { ObjectId, MongoServerError, type Filter } from 'mongodb'
import type { z } from 'zod'
import { escapeRegex } from '@/lib/slug'
import type { Role } from '@/lib/types'
import type { profileSchema, registerSchema } from '@/lib/validation'
import { hashPassword, verifyPassword } from '../auth'
import { collections } from '../db'
import type { UserDoc } from '../documents'
import { adminEmails } from '../env'
import { badRequest, conflict, notFound } from '../http'

export async function registerUser(input: z.infer<typeof registerSchema>): Promise<UserDoc> {
  const { users } = await collections()
  const now = new Date()
  const doc: UserDoc = {
    _id: new ObjectId(),
    email: input.email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
    role: adminEmails().includes(input.email) ? 'admin' : 'customer',
    phone: input.phone,
    address: '',
    disabled: false,
    createdAt: now,
    updatedAt: now,
  }
  try {
    await users.insertOne(doc)
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000)
      throw conflict('An account with this email already exists.', { email: 'This email is already registered. Try logging in.' })
    throw err
  }
  return doc
}

export async function authenticate(email: string, password: string): Promise<UserDoc | null> {
  const { users } = await collections()
  const user = await users.findOne({ email })
  const valid = await verifyPassword(password, user?.passwordHash ?? null)
  if (!user || !valid || user.disabled) return null
  return user
}

export async function updateProfile(userId: ObjectId, input: z.infer<typeof profileSchema>) {
  const { users } = await collections()
  const res = await users.findOneAndUpdate(
    { _id: userId },
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!res) throw notFound('Account not found.')
  return res
}

export async function changePassword(user: UserDoc, currentPassword: string, newPassword: string) {
  if (!(await verifyPassword(currentPassword, user.passwordHash)))
    throw badRequest('Your current password is incorrect.', { currentPassword: 'Incorrect password' })
  const { users } = await collections()
  await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(newPassword), updatedAt: new Date() } })
}

export async function listCustomers({ q = '', page = 1 }: { q?: string; page?: number }) {
  const { users } = await collections()
  const filter: Filter<UserDoc> = {}
  if (q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i')
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }]
  }
  const [rows, total] = await Promise.all([
    users
      .aggregate<UserDoc & { orderCount: number; totalSpent: number }>([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * 30 },
        { $limit: 30 },
        {
          $lookup: {
            from: 'orders',
            let: { uid: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$userId', '$$uid'] }, status: { $ne: 'cancelled' } } },
              { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$total' } } },
            ],
            as: 'stats',
          },
        },
        {
          $addFields: {
            orderCount: { $ifNull: [{ $first: '$stats.count' }, 0] },
            totalSpent: { $ifNull: [{ $first: '$stats.spent' }, 0] },
          },
        },
        { $project: { passwordHash: 0, stats: 0 } },
      ])
      .toArray(),
    users.countDocuments(filter),
  ])
  return {
    customers: rows.map((u) => ({
      id: u._id.toHexString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      disabled: u.disabled,
      orderCount: u.orderCount,
      totalSpent: u.totalSpent,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    pages: Math.max(1, Math.ceil(total / 30)),
  }
}

export async function updateUserByAdmin(id: ObjectId, actingAdminId: ObjectId, input: { role?: Role; disabled?: boolean; password?: string }) {
  if (id.equals(actingAdminId)) throw badRequest('You cannot change your own role or disable your own account.')
  const { users, sessions } = await collections()
  const { password, ...rest } = input
  const update = { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}), updatedAt: new Date() }
  const res = await users.findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' })
  if (!res) throw notFound('Customer not found.')
  if (input.disabled || password) await sessions.deleteMany({ userId: id })
  return { id: res._id.toHexString(), role: res.role, disabled: res.disabled }
}
