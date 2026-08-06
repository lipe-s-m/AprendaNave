import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { adminRequired } from '../middleware/auth'
import { serializarQuiz, validarQuizParaEnvio } from '../services/quiz.service'

export const adminRoutes = new Hono()

// Todas as rotas exigem admin
adminRoutes.use('*', adminRequired)

// GET /admin/cursos - catálogo completo para o modo de edição do administrador.
adminRoutes.get('/cursos', async (c) => {
  const cursos = await prisma.curso.findMany({ orderBy: [{ status: 'asc' }, { nome: 'asc' }] })
  return c.json(cursos.map((curso) => ({
    id: curso.id, nome: curso.nome, logo: curso.logo, descricao: curso.descricao,
    autorNome: curso.autor_nome, autorId: curso.autor_id, status: curso.status,
  })))
})

// Eventos públicos podem ser encerrados sem apagar o ranking final.
adminRoutes.get('/desafio-eventos', async (c) => {
  const eventos = await prisma.desafio_evento.findMany({ orderBy: { criado_em: 'desc' } })
  return c.json(eventos.map((evento) => ({ id: Number(evento.id), slug: evento.slug, nome: evento.nome, descricao: evento.descricao, status: evento.status, jogoHabilitado: evento.jogo_habilitado, inicioEm: evento.inicio_em, fimEm: evento.fim_em })))
})

adminRoutes.patch('/desafio-eventos/:id', async (c) => {
  try {
    const body = await c.req.json()
    const statusValidos = ['RASCUNHO', 'ATIVO', 'ENCERRADO']
    if (body.status !== undefined && !statusValidos.includes(body.status)) return c.json({ error: 'Status inválido' }, 400)
    const evento = await prisma.desafio_evento.update({ where: { id: BigInt(c.req.param('id')!) }, data: {
      ...(body.nome !== undefined ? { nome: String(body.nome).trim() } : {}),
      ...(body.descricao !== undefined ? { descricao: body.descricao ? String(body.descricao).trim() : null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.jogoHabilitado !== undefined ? { jogo_habilitado: !!body.jogoHabilitado } : {}),
      ...(body.inicioEm !== undefined ? { inicio_em: body.inicioEm ? new Date(body.inicioEm) : null } : {}),
      ...(body.fimEm !== undefined ? { fim_em: body.fimEm ? new Date(body.fimEm) : null } : {}),
      atualizado_em: new Date(),
    } })
    return c.json({ id: Number(evento.id), status: evento.status, jogoHabilitado: evento.jogo_habilitado })
  } catch { return c.json({ error: 'Não foi possível atualizar o evento' }, 400) }
})

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

// ── Quiz e questões ──

adminRoutes.get('/quizzes/pendentes', async (c) => {
  const quizzes = await prisma.quiz.findMany({
    where: { status: 'Pendente' },
    include: { modulo: { include: { curso: { select: { nome: true, status: true } } } }, questoes: { include: { alternativas: true }, orderBy: { ordem: 'asc' } } },
    orderBy: { criado_em: 'asc' },
  })
  return c.json(quizzes.map((quiz) => ({ ...serializarQuiz(quiz, true), moduloNome: quiz.modulo.nome, moduloStatus: quiz.modulo.status, cursoNome: quiz.modulo.curso.nome, cursoStatus: quiz.modulo.curso.status })))
})

adminRoutes.patch('/quizzes/:id/aprovar', async (c) => {
  try {
    const id = BigInt(c.req.param('id'))
    const quiz = await prisma.quiz.findFirst({ where: { id }, include: { modulo: { include: { curso: true } } } })
    if (!quiz) return c.json({ error: 'Quiz não encontrado' }, 404)
    if (quiz.modulo.status !== 'Aprovado' || quiz.modulo.curso.status !== 'Aprovado') return c.json({ error: 'O curso e o módulo do quiz devem estar aprovados' }, 400)
    const validacao = await validarQuizParaEnvio(id, true)
    if (!validacao.valida) return c.json({ error: `Aprove ao menos 5 questões válidas antes do quiz; há ${validacao.quantidade}.` }, 400)
    await prisma.quiz.update({ where: { id }, data: { status: 'Aprovado', atualizado_em: new Date() } })
    return c.json({ ok: true })
  } catch { return c.json({ error: 'Erro ao aprovar quiz' }, 400) }
})

adminRoutes.patch('/quizzes/:id/rejeitar', async (c) => {
  try { await prisma.quiz.update({ where: { id: BigInt(c.req.param('id')) }, data: { status: 'Rejeitado', atualizado_em: new Date() } }); return c.json({ ok: true }) }
  catch { return c.json({ error: 'Erro ao rejeitar quiz' }, 400) }
})

adminRoutes.get('/questoes/pendentes', async (c) => {
  const questoes = await prisma.quiz_questao.findMany({
    where: { status: 'Pendente' },
    include: { alternativas: { orderBy: { ordem: 'asc' } }, quiz: { include: { modulo: { include: { curso: { select: { nome: true, status: true } } } } } } },
    orderBy: { criado_em: 'asc' },
  })
  return c.json(questoes.map((q) => ({ id: Number(q.id), quizId: Number(q.id_quiz), enunciado: q.enunciado, explicacao: q.explicacao, status: q.status, alternativas: q.alternativas.map((a) => ({ id: Number(a.id), texto: a.texto, correta: a.correta })), quizTitulo: q.quiz.titulo, moduloNome: q.quiz.modulo.nome, moduloStatus: q.quiz.modulo.status, cursoNome: q.quiz.modulo.curso.nome, cursoStatus: q.quiz.modulo.curso.status })))
})

adminRoutes.patch('/questoes/:id/aprovar', async (c) => {
  try {
    const questao = await prisma.quiz_questao.findFirst({ where: { id: BigInt(c.req.param('id')) }, include: { alternativas: true, quiz: { include: { modulo: { include: { curso: true } } } } } })
    if (!questao) return c.json({ error: 'Questão não encontrada' }, 404)
    if (questao.quiz.modulo.status !== 'Aprovado' || questao.quiz.modulo.curso.status !== 'Aprovado') return c.json({ error: 'O curso e o módulo da questão devem estar aprovados' }, 400)
    if (questao.alternativas.length !== 4 || questao.alternativas.filter((a) => a.correta).length !== 1) return c.json({ error: 'A questão deve ter quatro alternativas e uma correta' }, 400)
    await prisma.quiz_questao.update({ where: { id: questao.id }, data: { status: 'Aprovado', atualizado_em: new Date() } })
    return c.json({ ok: true })
  } catch { return c.json({ error: 'Erro ao aprovar questão' }, 400) }
})

adminRoutes.patch('/questoes/:id/rejeitar', async (c) => {
  try { await prisma.quiz_questao.update({ where: { id: BigInt(c.req.param('id')) }, data: { status: 'Rejeitado', atualizado_em: new Date() } }); return c.json({ ok: true }) }
  catch { return c.json({ error: 'Erro ao rejeitar questão' }, 400) }
})
