import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, authCookie, jsonBody } from './setup'
import { cursosRoutes } from '../routes/cursos'

const app = new Hono()
app.route('/cursos', cursosRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

const fakeCurso = {
  id: 1, nome: 'Matematica', logo: 'https://img.com/math.svg',
  autor_nome: 'Prof Paulo', autor_id: 1, descricao: 'Curso de matematica', status: 'Aprovado',
}

describe('GET /cursos/aprovados', () => {
  it('retorna cursos com shape correta (camelCase)', async () => {
    prismaMock.curso.findMany.mockResolvedValue([fakeCurso])

    const res = await app.request('http://localhost/cursos/aprovados')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body).toHaveLength(1)
    expect(body[0]).toEqual({
      id: 1,
      nome: 'Matematica',
      logo: 'https://img.com/math.svg',
      autorNome: 'Prof Paulo',
      autorId: 1,
      descricao: 'Curso de matematica',
      status: 'Aprovado',
      modulos: [],
    })
  })

  it('retorna 404 quando nao ha cursos', async () => {
    prismaMock.curso.findMany.mockResolvedValue([])
    const res = await app.request('http://localhost/cursos/aprovados')
    expect(res.status).toBe(404)
  })
})

describe('POST /cursos (criar curso)', () => {
  it('retorna 401 sem auth', async () => {
    const res = await app.request('http://localhost/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'X', logo: 'x', autorNome: 'Y', descricao: 'Z' }),
    })
    expect(res.status).toBe(401)
  })

  it('cria curso e retorna CursoResponseDTO com statusAprovacao numerico', async () => {
    prismaMock.curso.create.mockResolvedValue({
      ...fakeCurso, id: 5, status: 'Pendente',
    })

    const res = await app.request('http://localhost/cursos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ nome: 'Novo Curso', logo: 'x.png', autorNome: 'Prof', descricao: 'Desc' }),
    })

    expect(res.status).toBe(201)
    const body = await jsonBody(res)
    expect(body.statusAprovacao).toBe(0) // Pendente = 0
    expect(body).toHaveProperty('id')
    expect(body).toHaveProperty('autorNome')
    expect(body).toHaveProperty('autorId')
  })
})

describe('GET /cursos/me', () => {
  it('retorna cursos do usuario com statusAprovacao numerico', async () => {
    prismaMock.curso.findMany.mockResolvedValue([
      { ...fakeCurso, status: 'Aprovado' },
      { ...fakeCurso, id: 2, status: 'Pendente' },
    ])

    const res = await app.request('http://localhost/cursos/me', {
      headers: { Cookie: authCookie(1) },
    })

    expect(res.status).toBe(200)
    const body = await jsonBody(res)
    expect(body[0].statusAprovacao).toBe(1) // Aprovado
    expect(body[1].statusAprovacao).toBe(0) // Pendente
  })
})

describe('GET /cursos/:cursoId/modulos/aprovados', () => {
  it('retorna modulos com shape camelCase', async () => {
    const now = new Date()
    prismaMock.modulo.findMany.mockResolvedValue([{
      id: 1, nome: 'Fundamentos', descricao: 'Basico', ordem: 1, nivel: 1,
      quantidade_aulas: 4, quantidade_horas: 2, playlist: null,
      status: 'Aprovado', curso_id: 1, created_at: now, last_updated_at: now,
    }])

    const res = await app.request('http://localhost/cursos/1/modulos/aprovados')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0]).toEqual(expect.objectContaining({
      id: 1,
      nome: 'Fundamentos',
      quantidadeAulas: 4,
      quantidadeHoras: 2,
      cursoId: 1,
    }))
  })
})
