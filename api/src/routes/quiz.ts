import { Hono } from 'hono'
import prisma from '../lib/prisma'
import { authRequired, getCurrentUserId, isCursoOwner, isModuloOwner } from '../middleware/auth'
import { criarTentativa, finalizarTentativa, obterQuizDoCriador, serializarQuiz, validarAlternativas, validarQuizParaEnvio } from '../services/quiz.service'

export const quizRoutes = new Hono()

function numero(valor: string) { return Number.parseInt(valor, 10) }
function idQuiz(valor: string) { return BigInt(valor) }
function paraNumero(valor: bigint) { return Number(valor) }

async function garantirDonoModulo(c: any, moduloId: number) {
  const userId = getCurrentUserId(c)!
  return (await isModuloOwner(userId, moduloId)) ? userId : null
}

// ----- Painel do criador -----
quizRoutes.get('/cursos/:cursoId/quizzes', authRequired, async (c) => {
  const cursoId = numero(c.req.param('cursoId')!)
  const userId = getCurrentUserId(c)!
  if (!(await isCursoOwner(userId, cursoId))) return c.json({ error: 'Sem permissão para este curso' }, 403)
  const quizzes = await prisma.quiz.findMany({ where: { modulo: { curso_id: cursoId } }, include: { questoes: { include: { alternativas: true } }, modulo: { select: { nome: true } } }, orderBy: { id_modulo: 'asc' } })
  return c.json(quizzes.map((quiz) => ({ ...serializarQuiz(quiz, true), moduloNome: quiz.modulo.nome })))
})

quizRoutes.get('/modulos/:moduloId/quiz/gerenciar', authRequired, async (c) => {
  const moduloId = numero(c.req.param('moduloId')!)
  const userId = await garantirDonoModulo(c, moduloId)
  if (!userId) return c.json({ error: 'Sem permissão para este módulo' }, 403)
  const quiz = await obterQuizDoCriador(moduloId, userId)
  return c.json({ quiz })
})

quizRoutes.post('/modulos/:moduloId/quiz', authRequired, async (c) => {
  try {
    const moduloId = numero(c.req.param('moduloId')!)
    const userId = await garantirDonoModulo(c, moduloId)
    if (!userId) return c.json({ error: 'Sem permissão para este módulo' }, 403)
    const body = await c.req.json()
    if (!body.titulo?.trim() || !Number.isInteger(body.notaMinima ?? 70) || (body.notaMinima ?? 70) < 1 || (body.notaMinima ?? 70) > 100) return c.json({ error: 'Dados do quiz inválidos' }, 400)
    const quiz = await prisma.quiz.create({ data: { id_modulo: moduloId, criado_por_id: userId, titulo: body.titulo.trim(), descricao: body.descricao?.trim() || null, nota_minima: body.notaMinima ?? 70 } })
    return c.json(serializarQuiz(quiz), 201)
  } catch (error: any) {
    if (error?.code === 'P2002') return c.json({ error: 'Este módulo já possui um quiz' }, 409)
    return c.json({ error: 'Não foi possível criar o quiz' }, 400)
  }
})

quizRoutes.put('/modulos/:moduloId/quiz', authRequired, async (c) => {
  const moduloId = numero(c.req.param('moduloId')!)
  const userId = await garantirDonoModulo(c, moduloId)
  if (!userId) return c.json({ error: 'Sem permissão para este módulo' }, 403)
  const body = await c.req.json()
  if (body.notaMinima !== undefined && (!Number.isInteger(body.notaMinima) || body.notaMinima < 1 || body.notaMinima > 100)) return c.json({ error: 'Nota mínima inválida' }, 400)
  const quiz = await prisma.quiz.updateMany({ where: { id_modulo: moduloId, criado_por_id: userId }, data: { ...(body.titulo !== undefined ? { titulo: String(body.titulo).trim() } : {}), ...(body.descricao !== undefined ? { descricao: body.descricao?.trim() || null } : {}), ...(body.notaMinima !== undefined ? { nota_minima: body.notaMinima } : {}), status: 'Pendente', atualizado_em: new Date() } })
  if (!quiz.count) return c.json({ error: 'Quiz não encontrado' }, 404)
  return c.json({ ok: true, status: 'Pendente' })
})

quizRoutes.delete('/modulos/:moduloId/quiz', authRequired, async (c) => {
  const moduloId = numero(c.req.param('moduloId')!)
  const userId = await garantirDonoModulo(c, moduloId)
  if (!userId) return c.json({ error: 'Sem permissão para este módulo' }, 403)
  const result = await prisma.quiz.deleteMany({ where: { id_modulo: moduloId, criado_por_id: userId, status: { not: 'Aprovado' } } })
  if (!result.count) return c.json({ error: 'Somente quizzes pendentes ou rejeitados podem ser excluídos' }, 400)
  return c.json({ ok: true })
})

quizRoutes.post('/modulos/:moduloId/quiz/enviar-aprovacao', authRequired, async (c) => {
  const moduloId = numero(c.req.param('moduloId')!)
  const userId = await garantirDonoModulo(c, moduloId)
  if (!userId) return c.json({ error: 'Sem permissão para este módulo' }, 403)
  const quiz = await prisma.quiz.findFirst({ where: { id_modulo: moduloId, criado_por_id: userId } })
  if (!quiz) return c.json({ error: 'Quiz não encontrado' }, 404)
  const validacao = await validarQuizParaEnvio(quiz.id, false)
  if (!validacao.valida) return c.json({ error: `Adicione ao menos 5 questões válidas; há ${validacao.quantidade}.` }, 400)
  await prisma.quiz.update({ where: { id: quiz.id }, data: { status: 'Pendente', atualizado_em: new Date() } })
  return c.json({ ok: true })
})

quizRoutes.post('/quizzes/:quizId/questoes', authRequired, async (c) => {
  try {
    const quizId = idQuiz(c.req.param('quizId')!)
    const userId = getCurrentUserId(c)!
    const quiz = await prisma.quiz.findFirst({ where: { id: quizId, criado_por_id: userId } })
    if (!quiz) return c.json({ error: 'Sem permissão para este quiz' }, 403)
    const body = await c.req.json()
    const alternativas = validarAlternativas(body.alternativas)
    if (!body.enunciado?.trim() || !alternativas) return c.json({ error: 'A questão precisa de enunciado e exatamente 4 alternativas, com uma correta' }, 400)
    const ultima = await prisma.quiz_questao.aggregate({ where: { id_quiz: quizId }, _max: { ordem: true } })
    const questao = await prisma.quiz_questao.create({ data: { id_quiz: quizId, enunciado: body.enunciado.trim(), explicacao: body.explicacao?.trim() || null, ordem: (ultima._max.ordem ?? 0) + 1, alternativas: { create: alternativas.map((a, indice) => ({ ...a, ordem: indice + 1 })) } }, include: { alternativas: { orderBy: { ordem: 'asc' } } } })
    await prisma.quiz.update({ where: { id: quizId }, data: { status: 'Pendente', atualizado_em: new Date() } })
    return c.json(serializarQuiz({ ...quiz, questoes: [questao] }, true).questoes[0], 201)
  } catch { return c.json({ error: 'Não foi possível criar a questão' }, 400) }
})

quizRoutes.put('/quizzes/:quizId/questoes/:questaoId', authRequired, async (c) => {
  try {
    const quizId = idQuiz(c.req.param('quizId')!), questaoId = idQuiz(c.req.param('questaoId')!), userId = getCurrentUserId(c)!
    const quiz = await prisma.quiz.findFirst({ where: { id: quizId, criado_por_id: userId } })
    if (!quiz) return c.json({ error: 'Sem permissão para este quiz' }, 403)
    const body = await c.req.json(), alternativas = validarAlternativas(body.alternativas)
    if (!body.enunciado?.trim() || !alternativas) return c.json({ error: 'Dados da questão inválidos' }, 400)
    await prisma.$transaction([
      prisma.quiz_alternativa.deleteMany({ where: { id_questao: questaoId } }),
      prisma.quiz_questao.update({ where: { id: questaoId }, data: { enunciado: body.enunciado.trim(), explicacao: body.explicacao?.trim() || null, status: 'Pendente', atualizado_em: new Date(), alternativas: { create: alternativas.map((a, indice) => ({ ...a, ordem: indice + 1 })) } } }),
      prisma.quiz.update({ where: { id: quizId }, data: { status: 'Pendente', atualizado_em: new Date() } }),
    ])
    return c.json({ ok: true, status: 'Pendente' })
  } catch { return c.json({ error: 'Não foi possível atualizar a questão' }, 400) }
})

quizRoutes.delete('/quizzes/:quizId/questoes/:questaoId', authRequired, async (c) => {
  const quizId = idQuiz(c.req.param('quizId')!), questaoId = idQuiz(c.req.param('questaoId')!), userId = getCurrentUserId(c)!
  const quiz = await prisma.quiz.findFirst({ where: { id: quizId, criado_por_id: userId } })
  if (!quiz) return c.json({ error: 'Sem permissão para este quiz' }, 403)
  const deleted = await prisma.quiz_questao.deleteMany({ where: { id: questaoId, id_quiz: quizId } })
  if (!deleted.count) return c.json({ error: 'Questão não encontrada' }, 404)
  await prisma.quiz.update({ where: { id: quizId }, data: { status: 'Pendente', atualizado_em: new Date() } })
  return c.json({ ok: true })
})

// ----- Jogador -----
quizRoutes.get('/modulos/:moduloId/quiz/status', authRequired, async (c) => {
  const moduloId = numero(c.req.param('moduloId')!), userId = getCurrentUserId(c)!
  const quiz = await prisma.quiz.findFirst({ where: { id_modulo: moduloId, status: 'Aprovado' }, select: { id: true, titulo: true, descricao: true, nota_minima: true } })
  if (!quiz) return c.json({ disponivel: false, possuiQuiz: false })
  const [totalAulas, aulasConcluidas, resumo] = await Promise.all([
    prisma.aula.count({ where: { modulo_id: moduloId, status: 'Aprovado' } }), prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: moduloId } }), prisma.aluno_modulo_quiz.findUnique({ where: { id_aluno_id_modulo: { id_aluno: userId, id_modulo: moduloId } } }),
  ])
  return c.json({ possuiQuiz: true, disponivel: aulasConcluidas >= totalAulas, aulasPendentes: Math.max(0, totalAulas - aulasConcluidas), quiz: { id: paraNumero(quiz.id), titulo: quiz.titulo, descricao: quiz.descricao, notaMinima: quiz.nota_minima }, resumo: resumo && { melhorPercentual: resumo.melhor_percentual, tentativasRealizadas: resumo.tentativas_realizadas, aprovado: !!resumo.primeira_aprovacao_em } })
})

quizRoutes.post('/modulos/:moduloId/quiz/tentativas', authRequired, async (c) => {
  try { return c.json(await criarTentativa(numero(c.req.param('moduloId')!), getCurrentUserId(c)!), 201) }
  catch (error: any) { const mensagens: Record<string, string> = { AULAS_PENDENTES: 'Conclua todas as aulas antes de iniciar o quiz', QUIZ_INDISPONIVEL: 'Quiz ainda não está disponível' }; return c.json({ error: mensagens[error.message] ?? 'Não foi possível iniciar o quiz' }, 400) }
})

quizRoutes.post('/modulos/:moduloId/quiz/tentativas/:tentativaId/finalizar', authRequired, async (c) => {
  try { const body = await c.req.json(); return c.json(await finalizarTentativa(numero(c.req.param('moduloId')!), c.req.param('tentativaId')!, getCurrentUserId(c)!, body.respostas)) }
  catch (error: any) { return c.json({ error: error.message === 'TENTATIVA_NAO_ENCONTRADA' ? 'Tentativa não encontrada' : 'Respostas inválidas ou tentativa indisponível' }, error.message === 'TENTATIVA_NAO_ENCONTRADA' ? 404 : 400) }
})
