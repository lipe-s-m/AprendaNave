import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { prismaMock, cloudinaryMock, authCookie, jsonBody } from './setup'
import { cursosRoutes } from '../routes/cursos'

const app = new Hono()
app.route('/cursos', cursosRoutes)

beforeEach(() => {
  Object.values(prismaMock).forEach((model) =>
    Object.values(model).forEach((fn) => (fn as any).mockReset())
  )
  cloudinaryMock.uploader.upload.mockReset()
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

  it('retorna uma lista vazia quando nao ha cursos', async () => {
    prismaMock.curso.findMany.mockResolvedValue([])
    const res = await app.request('http://localhost/cursos/aprovados')
    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toEqual([])
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('informa quando existe outra página de cursos', async () => {
    prismaMock.curso.findMany.mockResolvedValue(
      Array.from({ length: 7 }, (_, indice) => ({ ...fakeCurso, id: indice + 1 }))
    )

    const res = await app.request('http://localhost/cursos/aprovados?pagina=1')

    expect(res.status).toBe(200)
    expect(await jsonBody(res)).toHaveLength(6)
    expect(res.headers.get('x-has-more')).toBe('true')
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

describe('POST /cursos/upload-logo', () => {
  it('envia uma imagem válida ao Cloudinary e devolve a URL segura', async () => {
    cloudinaryMock.uploader.upload.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/demo/course-cover.webp',
    })
    const formData = new FormData()
    formData.append('file', new File(['imagem'], 'capa.png', { type: 'image/png' }))

    const res = await app.request('http://localhost/cursos/upload-logo', {
      method: 'POST',
      headers: { Cookie: authCookie(7) },
      body: formData,
    })

    expect(res.status).toBe(201)
    expect(await jsonBody(res)).toEqual({
      logoUrl: 'https://res.cloudinary.com/demo/course-cover.webp',
    })
    expect(cloudinaryMock.uploader.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^data:image\/png;base64,/),
      expect.objectContaining({ folder: 'courses/logos' })
    )
  })

  it('recusa arquivos que não são imagens aceitas', async () => {
    const formData = new FormData()
    formData.append('file', new File(['texto'], 'capa.txt', { type: 'text/plain' }))

    const res = await app.request('http://localhost/cursos/upload-logo', {
      method: 'POST',
      headers: { Cookie: authCookie(1) },
      body: formData,
    })

    expect(res.status).toBe(400)
    expect(cloudinaryMock.uploader.upload).not.toHaveBeenCalled()
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
  it('retorna modulos com shape camelCase (contagem dinâmica de aulas)', async () => {
    const now = new Date()
    prismaMock.modulo.findMany.mockResolvedValue([{
      id: 1, nome: 'Fundamentos', descricao: 'Basico', ordem: 1, nivel: 1,
      quantidade_aulas: 0, quantidade_horas: 2, playlist: null,
      status: 'Aprovado', curso_id: 1, created_at: now, last_updated_at: now,
    }])
    // Fonte da verdade: 4 aulas aprovadas no banco (coluna legada não conta)
    prismaMock.aula.findMany.mockResolvedValue([
      { id: 1, modulo_id: 1, status: 'Aprovado' },
      { id: 2, modulo_id: 1, status: 'Aprovado' },
      { id: 3, modulo_id: 1, status: 'Aprovado' },
      { id: 4, modulo_id: 1, status: 'Aprovado' },
    ])

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
