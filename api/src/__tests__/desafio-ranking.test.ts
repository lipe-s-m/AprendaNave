import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, jsonBody } from './setup'
import { desafioJccRoutes } from '../routes/desafioJcc'
import { rankingRoutes } from '../routes/ranking'
import { guestsRoutes } from '../routes/guests'

const app = new Hono()
app.route('/desafio/desafio-jcc', desafioJccRoutes)
app.route('/rankings', rankingRoutes)
app.route('/guests', guestsRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

describe('GET /desafio/desafio-jcc/ranking', () => {
  it('retorna top 5 com shape { idAluno, nomeAluno, pontuacaoAluno }', async () => {
    prismaMock.desafio_jcc.findMany.mockResolvedValue([
      { id: 1, id_aluno: 21, nome_aluno: 'iB', pontos: 145 },
      { id: 2, id_aluno: 34, nome_aluno: 'Joao', pontos: 75 },
    ])

    const res = await app.request('http://localhost/desafio/desafio-jcc/ranking')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0]).toEqual({ idAluno: 21, nomeAluno: 'iB', pontuacaoAluno: 145 })
    expect(body[1]).toEqual({ idAluno: 34, nomeAluno: 'Joao', pontuacaoAluno: 75 })
  })
})

describe('PATCH /desafio/desafio-jcc/pontuacao', () => {
  it('aceita PascalCase (como o frontend envia)', async () => {
    prismaMock.desafio_jcc.findFirst.mockResolvedValue(null)
    prismaMock.desafio_jcc.create.mockResolvedValue({})

    const res = await app.request('http://localhost/desafio/desafio-jcc/pontuacao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IdAluno: 5, NomeAluno: 'Felipe', PontuacaoAluno: 100 }),
    })

    expect(res.status).toBe(200)
    const body = await jsonBody(res)
    expect(body).toEqual({ idAluno: 5, nomeAluno: 'Felipe', pontuacaoAluno: 100 })
  })

  it('rejeita pontuacao negativa', async () => {
    const res = await app.request('http://localhost/desafio/desafio-jcc/pontuacao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ IdAluno: 1, NomeAluno: 'X', PontuacaoAluno: -5 }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /rankings/modalidade/ranking', () => {
  it('retorna top 5 por modalidade', async () => {
    prismaMock.ranking.findMany.mockResolvedValue([
      { id: 1, id_aluno: 10, nome_aluno: 'Ana', pontos: 200, modalidade: 'matematica' },
    ])

    const res = await app.request('http://localhost/rankings/modalidade/ranking?modalidade=matematica')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0]).toEqual({
      idAluno: 10, nomeAluno: 'Ana', pontuacaoAluno: 200, modalidade: 'matematica',
    })
  })

  it('requer query param modalidade', async () => {
    const res = await app.request('http://localhost/rankings/modalidade/ranking')
    expect(res.status).toBe(400)
  })
})

describe('POST /guests', () => {
  it('cria guest e retorna { id, nome, contato } (201)', async () => {
    prismaMock.guest_user.create.mockResolvedValue({
      id: 50, nome: 'Visitante', contato: '21999999999',
      created_at: new Date(), last_updated_at: new Date(),
    })

    const res = await app.request('http://localhost/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Visitante', contato: '21999999999' }),
    })

    expect(res.status).toBe(201)
    const body = await jsonBody(res)
    expect(body).toEqual({ id: 50, nome: 'Visitante', contato: '21999999999' })
  })
})

describe('GET /guests', () => {
  it('retorna lista de guests com shape correta', async () => {
    prismaMock.guest_user.findMany.mockResolvedValue([
      { id: 1, nome: 'Guest1', contato: '111', created_at: new Date(), last_updated_at: new Date() },
      { id: 2, nome: 'Guest2', contato: '222', created_at: new Date(), last_updated_at: new Date() },
    ])

    const res = await app.request('http://localhost/guests')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body).toHaveLength(2)
    expect(body[0]).toEqual({ id: 1, nome: 'Guest1', contato: '111' })
  })
})
