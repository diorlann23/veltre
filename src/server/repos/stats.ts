import 'server-only'
import { collections } from '../db'
import { toOrder } from './orders'
import { getSettings } from './settings'

export async function dashboardStats() {
  const { orders, users, products } = await collections()
  const settings = await getSettings()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [summary, pending, customers, activeProducts, lowStock, recent] = await Promise.all([
    orders
      .aggregate<{ count: number; revenue: number }>([
        { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } },
      ])
      .toArray(),
    orders.countDocuments({ status: 'pending' }),
    users.countDocuments({ role: 'customer' }),
    products.countDocuments({ status: 'active' }),
    products
      .aggregate<{ _id: unknown; name: string; slug: string; color: string; size: string; stock: number }>([
        { $match: { status: 'active' } },
        { $unwind: '$variants' },
        { $match: { 'variants.stock': { $lte: settings.lowStockThreshold } } },
        { $project: { name: 1, slug: 1, color: '$variants.color', size: '$variants.size', stock: '$variants.stock' } },
        { $sort: { stock: 1, name: 1 } },
        { $limit: 12 },
      ])
      .toArray(),
    orders.find().sort({ createdAt: -1 }).limit(8).toArray(),
  ])

  return {
    orders30d: summary[0]?.count ?? 0,
    revenue30d: summary[0]?.revenue ?? 0,
    pendingOrders: pending,
    customers,
    activeProducts,
    lowStock: lowStock.map((l) => ({ id: String(l._id), name: l.name, color: l.color, size: l.size, stock: l.stock })),
    recentOrders: recent.map(toOrder),
  }
}
