import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, authCookie, jsonBody } from './setup'
import { aulasRoutes } from '../routes/aulas'

const app = new Hono()
app.route('/aulas', aulasRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

describe('GET /aulas/:aulaId', () => {
  it('retorna AulaResponseDTO com shape correta', async () => {
    prismaMock.aula.findFirst.mockResolvedValue({
      id: 1, titulo: 'Operacoes Basicas', descricao: 'Aprenda +, -, *, /',
      ordem: 1, duracao: 440, video_youtube_id: 'k2PbBawEV_0',
      status: 'Aprovado', modulo_id: 1,
    })

    const res = await app.request('http://localhost/aulas/1')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body).toEqual({
      idAula: 1,
      tituloAula: 'Operacoes Basicas',
      descricaoAula: 'Aprenda +, -, *, /',
      ordemAula: 1,
      duracaoAula: 440,
      videoYoutubeIdAula: 'k2PbBawEV_0',
      idModulo: 1,
    })
  })

  it('retorna 404 para aula inexistente', async () => {
    prismaMock.aula.findFirst.mockResolvedValue(null)
    const res = await app.request('http://localhost/aulas/999')
    expect(res.status).toBe(404)
  })
})

describe('GET /aulas/progresso/:moduloId', () => {
  it('retorna 401 sem auth', async () => {
    const res = await app.request('http://localhost/aulas/progresso/1')
    expect(res.status).toBe(401)
  })

  it('retorna array de IDs de aulas concluidas', async () => {
    prismaMock.aluno_aula_progresso.findMany.mockResolvedValue([
      { id_aula: 1 }, { id_aula: 3 }, { id_aula: 4 },
    ])

    const res = await app.request('http://localhost/aulas/progresso/1', {
      headers: { Cookie: authCookie(42) },
    })

    expect(res.status).toBe(200)
    const body = await jsonBody(res)
    expect(body).toEqual([1, 3, 4])
  })
})

describe('POST /aulas/:aulaId/concluir', () => {
  it('retorna 401 sem auth', async () => {
    const res = await app.request('http://localhost/aulas/1/concluir', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('marca aula como concluida e retorna idAula + idModulo', async () => {
    prismaMock.aula.findFirst.mockResolvedValue({ id: 5, modulo_id: 2 })
    prismaMock.aluno_aula_progresso.findFirst.mockResolvedValue(null)
    prismaMock.aluno_aula_progresso.create.mockResolvedValue({})

    const res = await app.request('http://localhost/aulas/5/concluir', {
      method: 'POST',
      headers: { Cookie: authCookie(1) },
    })

    expect(res.status).toBe(200)
    const body = await jsonBody(res)
    expect(body).toEqual({ idAula: 5, idModulo: 2 })
  })

  it('e idempotente (nao cria duplicata)', async () => {
    prismaMock.aula.findFirst.mockResolvedValue({ id: 5, modulo_id: 2 })
    prismaMock.aluno_aula_progresso.findFirst.mockResolvedValue({ id: 99 }) // ja existe

    const res = await app.request('http://localhost/aulas/5/concluir', {
      method: 'POST',
      headers: { Cookie: authCookie(1) },
    })

    expect(res.status).toBe(200)
    expect(prismaMock.aluno_aula_progresso.create).not.toHaveBeenCalled()
  })
})
