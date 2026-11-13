import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import bcrypt from 'bcryptjs'
import { MongoClient, ObjectId } from 'mongodb'
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from '../src/lib/validation'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set. Run with: node --env-file=.env.local … or export it first.')
  const rl = createInterface({ input: stdin, output: stdout })
  const ask = async (q: string, schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { issues: { message: string }[] } } }) => {
    for (;;) {
      const answer = await rl.question(q)
      const r = schema.safeParse(answer)
      if (r.success) return r.data as string
      console.log(`  ✗ ${r.error?.issues[0]?.message}`)
    }
  }
  const email = await ask('Admin email: ', emailSchema)
  const client = await new MongoClient(uri).connect()
  const users = client.db(process.env.MONGODB_DB || 'veltre').collection('users')
  await users.createIndex({ email: 1 }, { unique: true })
  const existing = await users.findOne({ email })
  if (existing) {
    await users.updateOne({ _id: existing._id }, { $set: { role: 'admin', disabled: false, updatedAt: new Date() } })
    console.log(`✓ ${email} is now an admin.`)
  } else {
    const name = await ask('Full name: ', nameSchema)
    const phone = await ask('WhatsApp number: ', phoneSchema)
    const password = await ask('Password (min 8, letters + numbers): ', passwordSchema)
    const now = new Date()
    await users.insertOne({ _id: new ObjectId(), email, name, phone, address: '', role: 'admin', disabled: false, passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now })
    console.log(`✓ Admin account created for ${email}. Log in at /login.`)
  }
  rl.close()
  await client.close()
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
