import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { adminRequired } from '../middleware/auth'

export const adminRoutes = new Hono()

// Todas as rotas exigem admin
adminRoutes.use('*', adminRequired)

// GET /admin/pendentes — todos os itens pendentes (cursos, módulos, aulas)
adminRoutes.get('/pendentes', async (c) => {
  try {
    const [cursos, modulos, aulas] = await Promise.all([
      prisma.curso.findMany({ where: { status: 'Pendente' } }),
      prisma.modulo.findMany({ where: { status: 'Pendente' } }),
      prisma.aula.findMany({ where: { status: 'Pendente' } }),
    ])

    const modulosData = await Promise.all(
      modulos.map(async (m) => {
        const curso = await prisma.curso.findFirst({ where: { id: m.curso_id }, select: { nome: true } })
        return {
          id: m.id, nome: m.nome, descricao: m.descricao, status: m.status,
          cursoId: m.curso_id, cursoNome: curso?.nome ?? '', tipo: 'modulo',
        }
      })
    )

    const aulasData = await Promise.all(
      aulas.map(async (a) => {
        const modulo = await prisma.modulo.findFirst({
          where: { id: a.modulo_id },
          select: { nome: true, curso: { select: { nome: true } } },
        })
        return {
          id: a.id, titulo: a.titulo, descricao: a.descricao, status: a.status,
          moduloId: a.modulo_id, moduloNome: modulo?.nome ?? '',
          cursoNome: modulo?.curso.nome ?? '', tipo: 'aula',
        }
      })
    )

    return c.json({
      cursos: cursos.map(c => ({
        id: c.id, nome: c.nome, autorNome: c.autor_nome, autorId: c.autor_id,
        descricao: c.descricao, status: c.status, tipo: 'curso',
      })),
      modulos: modulosData,
      aulas: aulasData,
    })
  } catch (ex) {
    return c.json({ error: 'Erro ao buscar pendentes' }, 500)
  }
})

// ── Cursos ──

adminRoutes.patch('/cursos/:id/aprovar', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    await prisma.curso.update({ where: { id }, data: { status: 'Aprovado' } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao aprovar curso' }, 400)
  }
})

adminRoutes.patch('/cursos/:id/rejeitar', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    await prisma.curso.update({ where: { id }, data: { status: 'Rejeitado' } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao rejeitar curso' }, 400)
  }
})

// ── Módulos ──

adminRoutes.patch('/modulos/:id/aprovar', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    // Verificar se o curso pai está aprovado
    const modulo = await prisma.modulo.findFirst({ where: { id }, select: { curso: { select: { status: true } } } })
    if (!modulo) return c.json({ error: 'Módulo não encontrado' }, 404)
    if (modulo.curso.status !== 'Aprovado') {
      return c.json({ error: 'O curso deste módulo ainda não foi aprovado' }, 400)
    }
    await prisma.modulo.update({ where: { id }, data: { status: 'Aprovado' } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao aprovar módulo' }, 400)
  }
})

adminRoutes.patch('/modulos/:id/rejeitar', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    await prisma.modulo.update({ where: { id }, data: { status: 'Rejeitado' } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao rejeitar módulo' }, 400)
  }
})

// ── Aulas ──

adminRoutes.patch('/aulas/:id/aprovar', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    // Verificar se o módulo pai está aprovado
    const aula = await prisma.aula.findFirst({ where: { id }, select: { modulo: { select: { status: true } } } })
    if (!aula) return c.json({ error: 'Aula não encontrada' }, 404)
    if (aula.modulo.status !== 'Aprovado') {
      return c.json({ error: 'O módulo desta aula ainda não foi aprovado' }, 400)
    }
    await prisma.aula.update({ where: { id }, data: { status: 'Aprovado' } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao aprovar aula' }, 400)
  }
})

adminRoutes.patch('/aulas/:id/rejeitar', async (c) => {
  try {
    const id = parseInt(c.req.param('id')!)
    await prisma.aula.update({ where: { id }, data: { status: 'Rejeitado' } })
    return c.json({ ok: true })
  } catch (ex) {
    return c.json({ error: 'Erro ao rejeitar aula' }, 400)
  }
})
