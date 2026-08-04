import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, authCookie, jsonBody } from './setup'
import { authRoutes } from '../routes/auth'
import bcrypt from 'bcryptjs'

const app = new Hono()
app.route('/auth', authRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

describe('POST /auth/login', () => {
  const loginUrl = 'http://localhost/auth/login'

  it('retorna 401 para email inexistente', async () => {
    prismaMock.aluno.findFirst.mockResolvedValue(null)

    const res = await app.request(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: 'naoexiste@test.com', Senha: '123456' }),
    })

    expect(res.status).toBe(401)
  })

  it('retorna 401 para senha incorreta', async () => {
    prismaMock.aluno.findFirst.mockResolvedValue({
      id: 1, nome: 'Test', email: 'test@test.com', senha: await bcrypt.hash('senhaCorreta', 10),
      cargo: 'Aluno', pontos: 0, bio: null, foto_perfil: null,
    })

    const res = await app.request(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: 'test@test.com', Senha: 'senhaErrada' }),
    })

    expect(res.status).toBe(401)
  })

  it('retorna 200 com shape correta e cookie no login valido', async () => {
    const hash = await bcrypt.hash('senha123', 10)
    prismaMock.aluno.findFirst.mockResolvedValue({
      id: 42, nome: 'Felipe', email: 'felipe@test.com', senha: hash,
      cargo: 'Aluno', pontos: 100, bio: 'Minha bio', foto_perfil: 'https://img.com/foto.jpg',
    })

    const res = await app.request(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Email: 'felipe@test.com', Senha: 'senha123' }),
    })

    expect(res.status).toBe(200)

    // Verifica cookie
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('access_token=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=None')

    // Verifica shape do JSON (contrato com frontend)
    const body = await jsonBody(res)
    expect(body).toEqual({
      id: 42,
      nome: 'Felipe',
      email: 'felipe@test.com',
      cargo: 'Aluno',
      pontos: 100,
      bio: 'Minha bio',
      fotoPerfil: 'https://img.com/foto.jpg',
    })
  })

  it('aceita campos em camelCase e PascalCase', async () => {
    const hash = await bcrypt.hash('teste', 10)
    prismaMock.aluno.findFirst.mockResolvedValue({
      id: 1, nome: 'X', email: 'x@x.com', senha: hash,
      cargo: 'Aluno', pontos: 0, bio: null, foto_perfil: null,
    })

    const res = await app.request(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'x@x.com', senha: 'teste' }),
    })

    expect(res.status).toBe(200)
  })
})

describe('GET /auth/validate-token', () => {
  it('retorna 401 sem cookie', async () => {
    const res = await app.request('http://localhost/auth/validate-token')
    expect(res.status).toBe(401)
  })

  it('retorna 200 com cookie valido', async () => {
    const res = await app.request('http://localhost/auth/validate-token', {
      headers: { Cookie: authCookie() },
    })
    expect(res.status).toBe(200)
  })
})

describe('POST /auth/logout', () => {
  it('limpa o cookie access_token', async () => {
    const res = await app.request('http://localhost/auth/logout', {
      method: 'POST',
      headers: { Cookie: authCookie() },
    })

    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('access_token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})
