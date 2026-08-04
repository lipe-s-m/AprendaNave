import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, authCookie, jsonBody } from './setup'
import { userRoutes } from '../routes/user'

const app = new Hono()
app.route('/user', userRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

describe('POST /user (cadastro)', () => {
  it('cria usuario e retorna shape correta (201)', async () => {
    prismaMock.aluno.create.mockResolvedValue({
      id: 10, nome: 'Novo User', email: 'novo@test.com', cargo: 'Aluno',
      pontos: 0, bio: null, foto_perfil: null, senha: 'hash',
      created_at: new Date(), last_updated_at: new Date(),
    })

    const res = await app.request('http://localhost/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Novo User', email: 'novo@test.com',
        senha: 'senha123', senhaConfirmacao: 'senha123',
      }),
    })

    expect(res.status).toBe(201)
    const body = await jsonBody(res)
    expect(body).toEqual({
      id: 10,
      nome: 'Novo User',
      email: 'novo@test.com',
      cargo: 'Aluno',
    })
  })

  it('rejeita senha curta (400)', async () => {
    const res = await app.request('http://localhost/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'X', email: 'x@x.com', senha: 'ab', senhaConfirmacao: 'ab',
      }),
    })
    expect(res.status).toBe(400)
  })

  it('rejeita senhas diferentes (400)', async () => {
    const res = await app.request('http://localhost/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'X', email: 'x@x.com', senha: 'senha123', senhaConfirmacao: 'outra456',
      }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /user (auth)', () => {
  it('retorna 401 sem cookie', async () => {
    const res = await app.request('http://localhost/user')
    expect(res.status).toBe(401)
  })

  it('retorna userId com cookie valido', async () => {
    const res = await app.request('http://localhost/user', {
      headers: { Cookie: authCookie(42) },
    })
    expect(res.status).toBe(200)
    const body = await jsonBody(res)
    expect(body).toBe(42)
  })
})

describe('PATCH /user (update perfil)', () => {
  it('retorna 401 sem auth', async () => {
    const res = await app.request('http://localhost/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: 'nova bio' }),
    })
    expect(res.status).toBe(401)
  })

  it('atualiza perfil e retorna UserResponseDTO shape', async () => {
    prismaMock.aluno.findFirst.mockResolvedValue({
      id: 1, nome: 'Old Name', bio: null, foto_perfil: null,
      email: 'test@test.com', cargo: 'Aluno', pontos: 50,
    })
    prismaMock.aluno.update.mockResolvedValue({
      id: 1, nome: 'New Name', bio: 'Minha bio', foto_perfil: 'https://img.com/pic.jpg',
      email: 'test@test.com', cargo: 'Aluno', pontos: 50,
    })

    const res = await app.request('http://localhost/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ nome: 'New Name', bio: 'Minha bio' }),
    })

    expect(res.status).toBe(200)
    const body = await jsonBody(res)
    expect(body).toEqual({
      nome: 'New Name',
      bio: 'Minha bio',
      fotoPerfil: 'https://img.com/pic.jpg',
      email: 'test@test.com',
      cargo: 'Aluno',
      pontos: 50,
      alunoModuloProgresso: [],
    })
  })
})
