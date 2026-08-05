import { vi } from 'vitest'
import jwt from 'jsonwebtoken'

// Mock Prisma
export const prismaMock = {
  aluno: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  curso: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  modulo: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  aula: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  desafio_jcc: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  ranking: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  guest_user: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  aluno_aula_progresso: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), groupBy: vi.fn() },
  aluno_modulo_progresso: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), groupBy: vi.fn() },
  aluno_conquista: { findFirst: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
  ranking_melhor_pontuacao: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
}

vi.mock('../lib/prisma', () => ({ default: prismaMock }))

// Set PRIVATE_KEY for JWT tests
process.env.PRIVATE_KEY = 'test-secret-key-for-tests'

// Helper: generate a valid JWT cookie header
export function authCookie(userId: number = 1, nome: string = 'Test User') {
  const token = jwt.sign(
    { id: userId.toString(), name: nome, email: 'test@test.com', cargo: 'Aluno' },
    process.env.PRIVATE_KEY!,
    { algorithm: 'HS256', expiresIn: '2h' }
  )
  return `access_token=${token}`
}

// Helper: make a JSON request to the Hono app
export async function jsonBody(res: Response) {
  return res.json()
}
