import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { getCurrentUserId } from '../middleware/auth'

export const cursosRoutes = new Hono()

function statusToInt(status: string): number {
  switch (status) {
    case 'Pendente': return 0
    case 'Aprovado': return 1
    case 'Rejeitado': return 2
    default: return 0
  }
}

// GET /cursos/me - must be before /:cursoId to avoid conflict
cursosRoutes.get('/me', async (c) => {
  try {
    const userId = getCurrentUserId(c)
    if (userId === null) return c.json({ error: 'Unauthorized' }, 401)

    const cursos = await prisma.curso.findMany({
      where: { autor_id: userId },
    })

    return c.json(
      cursos.map((curso) => ({
        id: curso.id,
        nome: curso.nome,
        logo: curso.logo,
        autorNome: curso.autor_nome,
        autorId: curso.autor_id,
        descricao: curso.descricao,
        statusAprovacao: statusToInt(curso.status),
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// GET /cursos/aprovados - paginated approved courses
cursosRoutes.get('/aprovados', async (c) => {
  try {
    const page = parseInt(c.req.query('pagina') || '1')
    const perPage = 6

    const cursos = await prisma.curso.findMany({
      where: { status: 'Aprovado' },
      skip: (page - 1) * perPage,
      take: perPage,
    })

    if (cursos.length === 0) {
      return c.json({ message: 'Nenhum curso encontrado.' }, 404)
    }

    return c.json(
      cursos.map((curso) => ({
        id: curso.id,
        nome: curso.nome,
        logo: curso.logo,
        autorNome: curso.autor_nome,
        autorId: curso.autor_id,
        descricao: curso.descricao,
        status: curso.status,
        modulos: [],
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// POST /cursos/ - create a new course
cursosRoutes.post('/', async (c) => {
  try {
    const userId = getCurrentUserId(c)
    if (userId === null) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()
    const { nome, logo, autorNome, descricao } = body

    const curso = await prisma.curso.create({
      data: {
        nome,
        logo,
        autor_nome: autorNome,
        autor_id: userId,
        descricao,
        status: 'Pendente',
      },
    })

    return c.json(
      {
        id: curso.id,
        nome: curso.nome,
        logo: curso.logo,
        autorNome: curso.autor_nome,
        autorId: curso.autor_id,
        descricao: curso.descricao,
        statusAprovacao: statusToInt(curso.status),
      },
      201
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao criar curso' }, 400)
  }
})

// GET /cursos/:cursoId/modulos/aprovados
cursosRoutes.get('/:cursoId/modulos/aprovados', async (c) => {
  try {
    const cursoId = parseInt(c.req.param('cursoId'))

    const modulos = await prisma.modulo.findMany({
      where: { curso_id: cursoId, status: 'Aprovado' },
    })

    return c.json(
      modulos.map((m) => ({
        id: m.id,
        nome: m.nome,
        descricao: m.descricao,
        ordem: m.ordem,
        nivel: m.nivel,
        quantidadeAulas: m.quantidade_aulas,
        quantidadeHoras: m.quantidade_horas,
        playlist: m.playlist,
        status: m.status,
        cursoId: m.curso_id,
        createdAt: m.created_at,
        lastUpdatedAt: m.last_updated_at,
      }))
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// POST /cursos/:cursoId/modulos - create module for a course
cursosRoutes.post('/:cursoId/modulos', async (c) => {
  try {
    const body = await c.req.json()

    const modulo = await prisma.modulo.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        curso_id: body.cursoId,
        ordem: body.ordem,
        nivel: body.nivel,
        quantidade_aulas: body.quantidadeAulas,
        quantidade_horas: body.quantidadeHoras ?? 0,
        status: 'Pendente',
        created_at: new Date(),
        last_updated_at: new Date(),
      },
    })

    return c.json(
      {
        id: modulo.id,
        nome: modulo.nome,
        descricao: modulo.descricao,
        ordem: modulo.ordem,
        nivel: modulo.nivel,
        quantidadeAulas: modulo.quantidade_aulas,
        quantidadeHoras: modulo.quantidade_horas,
        playlist: modulo.playlist,
        status: modulo.status,
        cursoId: modulo.curso_id,
        createdAt: modulo.created_at,
        lastUpdatedAt: modulo.last_updated_at,
      },
      201
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao criar módulo' }, 400)
  }
})
