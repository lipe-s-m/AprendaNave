import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: string
  name: string
  email: string
  cargo: string
  exp: number
}

export function getCurrentUserId(c: Context): number | null {
  const token = getCookie(c, 'access_token')
  if (!token) return null

  try {
    const secret = process.env.PRIVATE_KEY
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as JwtPayload
    return parseInt(decoded.id)
  } catch {
    return null
  }
}

export async function authRequired(c: Context, next: Next) {
  const userId = getCurrentUserId(c)
  if (userId === null) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('userId', userId)
  await next()
}
