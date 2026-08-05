import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

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

/** Verifica se userId é dono do curso. Retorna true se for owner OU admin. */
export async function isCursoOwner(userId: number, cursoId: number): Promise<boolean> {
  const [curso, aluno] = await Promise.all([
    prisma.curso.findFirst({ where: { id: cursoId }, select: { autor_id: true } }),
    prisma.aluno.findFirst({ where: { id: userId }, select: { cargo: true } }),
  ])
  if (!curso) return false
  return curso.autor_id === userId || aluno?.cargo === 'Admin'
}

/** Verifica se userId é dono do curso pai do módulo. */
export async function isModuloOwner(userId: number, moduloId: number): Promise<boolean> {
  const [modulo, aluno] = await Promise.all([
    prisma.modulo.findFirst({ where: { id: moduloId }, select: { curso: { select: { autor_id: true } } } }),
    prisma.aluno.findFirst({ where: { id: userId }, select: { cargo: true } }),
  ])
  if (!modulo) return false
  return modulo.curso.autor_id === userId || aluno?.cargo === 'Admin'
}

/** Middleware que exige que o usuário seja admin (cargo === 'Admin'). */
export async function adminRequired(c: Context, next: Next) {
  const userId = getCurrentUserId(c)
  if (userId === null) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const aluno = await prisma.aluno.findFirst({
    where: { id: userId },
    select: { cargo: true },
  })

  if (!aluno || aluno.cargo !== 'Admin') {
    return c.json({ error: 'Acesso restrito a administradores' }, 403)
  }

  c.set('userId', userId)
  await next()
}

/** Verifica se userId é dono do curso pai (via módulo → curso) da aula. */
export async function isAulaOwner(userId: number, aulaId: number): Promise<boolean> {
  const [aula, aluno] = await Promise.all([
    prisma.aula.findFirst({ where: { id: aulaId }, select: { modulo: { select: { curso: { select: { autor_id: true } } } } } }),
    prisma.aluno.findFirst({ where: { id: userId }, select: { cargo: true } }),
  ])
  if (!aula) return false
  return aula.modulo.curso.autor_id === userId || aluno?.cargo === 'Admin'
}
