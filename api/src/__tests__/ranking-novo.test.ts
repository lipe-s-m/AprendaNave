import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, authCookie, jsonBody } from './setup'
import { rankingRoutes } from '../routes/ranking'

const app = new Hono()
app.route('/rankings', rankingRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

function fakeAluno(id: number, pontos: number, nome = `Aluno ${id}`) {
  return { id, nome, foto_perfil: null, pontos }
}

describe('GET /rankings/categorias', () => {
  it('retorna exatamente os cinco slugs do catálogo', async () => {
    const res = await app.request('http://localhost/rankings/categorias')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body.map((c: any) => c.slug)).toEqual([
      'desafio-matematica',
      'navecoins',
      'aulas-concluidas',
      'modulos-concluidos',
      'conquistas',
    ])
    expect(body[0]).toHaveProperty('icone')
    expect(body[0]).toHaveProperty('unidade')
  })
})

describe('GET /rankings/:slug — navecoins', () => {
  it('ordena por pontos desc e calcula posição com empates (1, 2, 2, 4)', async () => {
    prismaMock.aluno.findMany.mockResolvedValue([
      fakeAluno(1, 100, 'Ana'),
      fakeAluno(2, 90, 'Bruno'),
      fakeAluno(3, 90, 'Carla'),
      fakeAluno(4, 70, 'Diego'),
    ])

    const res = await app.request('http://localhost/rankings/navecoins')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    const posicoes = body.entradas.map((e: any) => e.posicao)
    expect(posicoes).toEqual([1, 2, 2, 4])
    expect(body.totalParticipantes).toBe(4)
    expect(body.meuRanking).toBeNull()
  })

  it('categoria inexistente retorna 404', async () => {
    const res = await app.request('http://localhost/rankings/categoria-fake')
    expect(res.status).toBe(404)
    const body = await jsonBody(res)
    expect(body.error).toBe('Categoria de ranking não encontrada.')
  })

  it('meuRanking aparece para usuário autenticado fora do Top 20 e é null para visitante', async () => {
    // 25 alunos com valores distintos: id 1..25, pontos 100..76
    const alunos = Array.from({ length: 25 }, (_, i) => {
      const id = i + 1
      return fakeAluno(id, 100 - i)
    })
    prismaMock.aluno.findMany.mockResolvedValue(alunos)

    // Visitante: sem cookie
    const resVisitante = await app.request('http://localhost/rankings/navecoins?limite=20')
    const bodyVisitante = await jsonBody(resVisitante)
    expect(bodyVisitante.entradas).toHaveLength(20)
    expect(bodyVisitante.meuRanking).toBeNull()

    // Autenticado como aluno 25 (último, fora do Top 20)
    const resUser = await app.request('http://localhost/rankings/navecoins?limite=20', {
      headers: { Cookie: authCookie(25) },
    })
    const bodyUser = await jsonBody(resUser)
    expect(bodyUser.entradas).toHaveLength(20)
    expect(bodyUser.meuRanking).not.toBeNull()
    expect(bodyUser.meuRanking.posicao).toBe(25)
    expect(bodyUser.meuRanking.idAluno).toBe(25)
  })
})

describe('POST /rankings/desafio-matematica/resultado', () => {
  it('sem cookie retorna 401', async () => {
    const res = await app.request('http://localhost/rankings/desafio-matematica/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pontos: 42 }),
    })
    expect(res.status).toBe(401)
  })

  it('ignora idAluno/nome do body: o score pertence ao usuário do cookie', async () => {
    prismaMock.ranking_melhor_pontuacao.findFirst.mockResolvedValue(null)

    const res = await app.request('http://localhost/rankings/desafio-matematica/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(7) },
      body: JSON.stringify({ pontos: 42, idAluno: 999, nomeAluno: 'Hacker' }),
    })

    expect(res.status).toBe(201)
    const body = await jsonBody(res)
    expect(body).toEqual({ melhorou: true, melhorPontuacao: 42 })

    // O create usa o id do JWT (7), nunca o idAluno do body
    const data = prismaMock.ranking_melhor_pontuacao.create.mock.calls[0][0].data
    expect(data.id_aluno).toBe(7)
  })

  it('score menor não reduz score existente', async () => {
    prismaMock.ranking_melhor_pontuacao.findFirst.mockResolvedValue({
      id: 1n, id_aluno: 1, categoria: 'desafio-matematica', pontos: 50,
    })

    const res = await app.request('http://localhost/rankings/desafio-matematica/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ pontos: 30 }),
    })

    expect(res.status).toBe(201)
    const body = await jsonBody(res)
    expect(body).toEqual({ melhorou: false, melhorPontuacao: 50 })
    expect(prismaMock.ranking_melhor_pontuacao.update).not.toHaveBeenCalled()
  })

  it('score maior atualiza recorde', async () => {
    prismaMock.ranking_melhor_pontuacao.findFirst.mockResolvedValue({
      id: 1n, id_aluno: 1, categoria: 'desafio-matematica', pontos: 50,
    })
    prismaMock.ranking_melhor_pontuacao.update.mockResolvedValue({
      id: 1n, id_aluno: 1, categoria: 'desafio-matematica', pontos: 80,
    })

    const res = await app.request('http://localhost/rankings/desafio-matematica/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ pontos: 80 }),
    })

    expect(res.status).toBe(201)
    const body = await jsonBody(res)
    expect(body).toEqual({ melhorou: true, melhorPontuacao: 80 })
  })

  it('pontuação negativa retorna 400', async () => {
    const res = await app.request('http://localhost/rankings/desafio-matematica/resultado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ pontos: -5 }),
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /rankings/desafio-matematica — melhor pontuação', () => {
  it('lista com nome e foto vindos da tabela aluno', async () => {
    prismaMock.ranking_melhor_pontuacao.findMany.mockResolvedValue([
      { id: 1n, id_aluno: 1, categoria: 'desafio-matematica', pontos: 42, criado_em: new Date(), atualizado_em: null },
      { id: 2n, id_aluno: 2, categoria: 'desafio-matematica', pontos: 37, criado_em: new Date(), atualizado_em: null },
    ])
    prismaMock.aluno.findMany.mockResolvedValue([
      { id: 1, nome: 'Ana', foto_perfil: 'https://img.com/ana.png' },
      { id: 2, nome: 'Bruno', foto_perfil: null },
    ])

    const res = await app.request('http://localhost/rankings/desafio-matematica')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body.entradas[0]).toEqual({
      posicao: 1,
      idAluno: 1,
      nomeAluno: 'Ana',
      fotoPerfil: 'https://img.com/ana.png',
      valor: 42,
    })
    expect(body.entradas[1].fotoPerfil).toBeNull()
  })
})
