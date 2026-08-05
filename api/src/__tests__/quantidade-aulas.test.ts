import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, authCookie, jsonBody } from './setup'
import { cursosRoutes } from '../routes/cursos'
import { modulosRoutes } from '../routes/modulos'

const appCursos = new Hono()
appCursos.route('/cursos', cursosRoutes)

const appModulos = new Hono()
appModulos.route('/modulos', modulosRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
})

const now = new Date()

function fakeModulo(overrides: any = {}) {
  return {
    id: 1, nome: 'Fundamentos', descricao: 'Basico', ordem: 1, nivel: 1,
    quantidade_aulas: 0, quantidade_horas: 2, playlist: null,
    status: 'Aprovado', curso_id: 1, created_at: now, last_updated_at: now,
    ...overrides,
  }
}

function fakeAula(moduloId: number, status: string, id = 1) {
  return { id, modulo_id: moduloId, status }
}

describe('GET /cursos/:cursoId/modulos — contagem dinâmica', () => {
  it('público (sem auth) retorna apenas aulas aprovadas', async () => {
    prismaMock.modulo.findMany.mockResolvedValue([fakeModulo()])
    // 3 aulas: 2 aprovadas e 1 pendente
    prismaMock.aula.findMany.mockResolvedValue([
      fakeAula(1, 'Aprovado', 1),
      fakeAula(1, 'Aprovado', 2),
      fakeAula(1, 'Pendente', 3),
    ])

    const res = await appCursos.request('http://localhost/cursos/1/modulos')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0].quantidadeAulas).toBe(2)
    // Público não recebe o detalhamento do criador
    expect(body[0]).not.toHaveProperty('quantidadeAulasAprovadas')
    expect(body[0]).not.toHaveProperty('quantidadeAulasPendentes')
    expect(body[0]).not.toHaveProperty('quantidadeAulasRejeitadas')
  })

  it('criador (owner) retorna total e distribuição por status', async () => {
    prismaMock.modulo.findMany.mockResolvedValue([fakeModulo()])
    prismaMock.curso.findFirst.mockResolvedValue({ autor_id: 1 }) // isCursoOwner
    prismaMock.aula.findMany.mockResolvedValue([
      fakeAula(1, 'Aprovado', 1),
      fakeAula(1, 'Aprovado', 2),
      fakeAula(1, 'Pendente', 3),
      fakeAula(1, 'Rejeitado', 4),
    ])

    const res = await appCursos.request('http://localhost/cursos/1/modulos', {
      headers: { Cookie: authCookie(1) },
    })
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0].quantidadeAulas).toBe(4)
    expect(body[0].quantidadeAulasAprovadas).toBe(2)
    expect(body[0].quantidadeAulasPendentes).toBe(1)
    expect(body[0].quantidadeAulasRejeitadas).toBe(1)
  })
})

describe('GET /modulos/aprovados — contagem pública', () => {
  it('retorna quantidadeAulas = aulas aprovadas', async () => {
    prismaMock.modulo.findMany.mockResolvedValue([fakeModulo()])
    prismaMock.aula.findMany.mockResolvedValue([
      fakeAula(1, 'Aprovado', 1),
      fakeAula(1, 'Pendente', 2),
    ])

    const res = await appModulos.request('http://localhost/modulos/aprovados')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0].quantidadeAulas).toBe(1)
  })
})

describe('POST /cursos/:cursoId/modulos — sem quantidadeAulas como dado de negócio', () => {
  it('cria módulo com quantidade_aulas 0 e resposta com contagem real', async () => {
    prismaMock.curso.findFirst.mockResolvedValue({ autor_id: 1 }) // isCursoOwner
    prismaMock.modulo.create.mockResolvedValue(fakeModulo({ id: 9 }))
    prismaMock.aula.findMany.mockResolvedValue([])

    const res = await appCursos.request('http://localhost/cursos/1/modulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ nome: 'Novo', descricao: 'Desc', ordem: 1, nivel: 1, cursoId: 1 }),
    })

    expect(res.status).toBe(201)
    // Coluna legada gravada como 0 por compatibilidade
    expect(prismaMock.modulo.create.mock.calls[0][0].data.quantidade_aulas).toBe(0)

    const body = await jsonBody(res)
    expect(body.quantidadeAulas).toBe(0)
    expect(body.quantidadeAulasAprovadas).toBe(0)
  })

  it('criar aula não exige quantidadeAulas no body', async () => {
    prismaMock.modulo.findFirst.mockResolvedValue({ ...fakeModulo(), curso: { autor_id: 1 } }) // isModuloOwner
    prismaMock.aula.create.mockResolvedValue({
      id: 1, titulo: 'Aula 1', descricao: 'Desc', ordem: 1, duracao: null,
      video_youtube_id: 'abc', status: 'Pendente', modulo_id: 1,
    })

    const res = await appModulos.request('http://localhost/modulos/1/aulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ titulo: 'Aula 1', descricao: 'Desc', ordem: 1, videoYoutubeId: 'abc', idModulo: 1 }),
    })

    expect(res.status).toBe(201)
  })
})

describe('PUT /modulos/:id — quantidadeAulas é ignorada', () => {
  it('editar com quantidadeAulas: 999 não altera a fonte de verdade', async () => {
    prismaMock.modulo.findFirst.mockResolvedValue(fakeModulo({ curso: { autor_id: 1 } }))
    prismaMock.modulo.update.mockResolvedValue(fakeModulo({ nome: 'Editado' }))
    // Fonte de verdade: 2 aulas aprovadas no banco
    prismaMock.aula.findMany.mockResolvedValue([
      fakeAula(1, 'Aprovado', 1),
      fakeAula(1, 'Aprovado', 2),
    ])

    const res = await appModulos.request('http://localhost/modulos/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: authCookie(1) },
      body: JSON.stringify({ nome: 'Editado', quantidadeAulas: 999 }),
    })

    expect(res.status).toBe(200)
    // O update não toca a coluna legada
    const dataArg = prismaMock.modulo.update.mock.calls[0][0].data
    expect(dataArg).not.toHaveProperty('quantidade_aulas')

    const body = await jsonBody(res)
    expect(body.quantidadeAulas).toBe(2) // contagem real do banco
  })
})

describe('Deletar aula muda a contagem na próxima leitura', () => {
  it('público reflete a nova contagem após exclusão', async () => {
    prismaMock.modulo.findMany.mockResolvedValue([fakeModulo()])
    // Depois da exclusão, restou 1 aula aprovada
    prismaMock.aula.findMany.mockResolvedValue([fakeAula(1, 'Aprovado', 1)])

    const res = await appCursos.request('http://localhost/cursos/1/modulos')
    expect(res.status).toBe(200)

    const body = await jsonBody(res)
    expect(body[0].quantidadeAulas).toBe(1)
  })
})
