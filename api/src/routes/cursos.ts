import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { getCurrentUserId, authRequired, isCursoOwner } from '../middleware/auth'
import { mapModuloResponse, obterContagensAulasPorModulo } from '../lib/modulo-response'
import cloudinary from '../lib/cloudinary'

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
    // A Home deve refletir aprovações e remoções imediatamente.
    c.header('Cache-Control', 'no-store, max-age=0')
    const page = Math.max(1, parseInt(c.req.query('pagina') || '1') || 1)
    const perPage = 6

    const cursos = await prisma.curso.findMany({
      where: { status: 'Aprovado' },
      skip: (page - 1) * perPage,
      // Busca um item extra somente para informar corretamente se há próxima página.
      take: perPage + 1,
    })

    const temMais = cursos.length > perPage
    c.header('X-Has-More', String(temMais))

    return c.json(
      cursos.slice(0, perPage).map((curso) => ({
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

// POST /cursos/upload-logo - envia a capa do curso ao Cloudinary (auth required).
// A rota vem antes de /:id para não ser interpretada como um ID de curso.
cursosRoutes.post('/upload-logo', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const formData = await c.req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'Selecione uma imagem para a capa do curso.' }, 400)
    }

    const tiposPermitidos = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!tiposPermitidos.has(file.type)) {
      return c.json({ error: 'Envie uma imagem JPG, PNG ou WebP.' }, 400)
    }

    const tamanhoMaximo = 5 * 1024 * 1024
    if (file.size === 0 || file.size > tamanhoMaximo) {
      return c.json({ error: 'A imagem deve ter no máximo 5 MB.' }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`
    const upload = await cloudinary.uploader.upload(dataUri, {
      folder: 'courses/logos',
      public_id: `course_${userId}_${randomUUID()}`,
      resource_type: 'image',
      transformation: [{ width: 600, height: 600, crop: 'fill', gravity: 'auto' }],
    })

    return c.json({ logoUrl: upload.secure_url }, 201)
  } catch (error) {
    console.error('[POST /cursos/upload-logo] Erro:', error)
    return c.json({ error: 'Não foi possível enviar a imagem. Tente novamente.' }, 502)
  }
})

// GET /cursos/:id - fetch single course by ID
cursosRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    const curso = await prisma.curso.findFirst({ where: { id } })

    if (!curso) return c.json({ error: 'Curso não encontrado' }, 404)

    return c.json({
      id: curso.id,
      nome: curso.nome,
      logo: curso.logo,
      autorNome: curso.autor_nome,
      autorId: curso.autor_id,
      descricao: curso.descricao,
      statusAprovacao: statusToInt(curso.status),
    })
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// PUT /cursos/:id - update course (owner only)
cursosRoutes.put('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const cursoId = parseInt(c.req.param('id')!)

    if (!(await isCursoOwner(userId, cursoId))) {
      return c.json({ error: 'Você não tem permissão para editar este curso' }, 403)
    }

    const body = await c.req.json()
    const updated = await prisma.curso.update({
      where: { id: cursoId },
      data: {
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.logo !== undefined && { logo: body.logo }),
        ...(body.autorNome !== undefined && { autor_nome: body.autorNome }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
      },
    })

    return c.json({
      id: updated.id,
      nome: updated.nome,
      logo: updated.logo,
      autorNome: updated.autor_nome,
      autorId: updated.autor_id,
      descricao: updated.descricao,
      statusAprovacao: statusToInt(updated.status),
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao atualizar curso' }, 400)
  }
})

// DELETE /cursos/:id - delete course (owner only, cascade modulos + aulas)
cursosRoutes.delete('/:id', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const cursoId = parseInt(c.req.param('id')!)

    if (!(await isCursoOwner(userId, cursoId))) {
      return c.json({ error: 'Você não tem permissão para excluir este curso' }, 403)
    }

    await prisma.curso.delete({ where: { id: cursoId } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao excluir curso' }, 400)
  }
})

// GET /cursos/:cursoId/modulos - all modules (owner sees all, others see only approved)
cursosRoutes.get('/:cursoId/modulos', async (c) => {
  try {
    const cursoId = parseInt(c.req.param('cursoId')!)
    const userId = getCurrentUserId(c)

    // Se for o dono, mostra todos (incluindo Pendente/Rejeitado). Senão, só Aprovado.
    const where: any = { curso_id: cursoId }
    const isOwner = userId ? await isCursoOwner(userId, cursoId) : false
    if (!isOwner) {
      where.status = 'Aprovado'
    }

    const modulos = await prisma.modulo.findMany({ where, orderBy: { ordem: 'asc' } })

    // Contagem dinâmica a partir de `aula` (fonte da verdade), em lote
    const contagens = await obterContagensAulasPorModulo(modulos.map((m) => m.id))

    return c.json(
      modulos.map((m) =>
        mapModuloResponse(m, contagens.get(m.id)!, isOwner ? 'criador' : 'publico')
      )
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// GET /cursos/:cursoId/modulos/aprovados
cursosRoutes.get('/:cursoId/modulos/aprovados', async (c) => {
  try {
    const cursoId = parseInt(c.req.param('cursoId'))

    const modulos = await prisma.modulo.findMany({
      where: { curso_id: cursoId, status: 'Aprovado' },
    })

    const contagens = await obterContagensAulasPorModulo(modulos.map((m) => m.id))

    return c.json(
      modulos.map((m) =>
        mapModuloResponse(m, contagens.get(m.id)!, 'publico')
      )
    )
  } catch (ex) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

// POST /cursos/:cursoId/modulos - create module for a course (owner only)
cursosRoutes.post('/:cursoId/modulos', authRequired, async (c) => {
  try {
    const userId = getCurrentUserId(c)!
    const cursoId = parseInt(c.req.param('cursoId')!)

    if (!(await isCursoOwner(userId, cursoId))) {
      return c.json({ error: 'Você não tem permissão para adicionar módulos a este curso' }, 403)
    }

    const body = await c.req.json()

    // A ordem é opcional no create: quando ausente, empilha no final
    // (total de módulos existentes + 1). O criador pode reordenar depois
    // com os botões subir/descer (PUT /modulos/:id).
    const totalModulos = await prisma.modulo.count({ where: { curso_id: cursoId } })

    const modulo = await prisma.modulo.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        curso_id: body.cursoId,
        ordem: body.ordem ?? totalModulos + 1,
        nivel: body.nivel,
        // Coluna legada: NÃO é fonte de verdade. A contagem é calculada
        // dinamicamente a partir da tabela `aula` na resposta.
        quantidade_aulas: 0,
        quantidade_horas: body.quantidadeHoras ?? 0,
        status: 'Pendente',
        created_at: new Date(),
        last_updated_at: new Date(),
      },
    })

    const contagens = await obterContagensAulasPorModulo([modulo.id])

    return c.json(
      mapModuloResponse(modulo, contagens.get(modulo.id)!, 'criador'),
      201
    )
  } catch (ex) {
    return c.json({ error: 'Erro ao criar módulo' }, 400)
  }
})
