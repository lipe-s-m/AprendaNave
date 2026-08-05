import { randomUUID } from 'crypto'
import prisma from '../lib/prisma'
import { verificarConquistasQuiz } from './conquistas.service'

const MINIMO_QUESTOES = 5

type AlternativaEntrada = { texto: string; correta: boolean }
type QuestaoSnapshot = {
  id: number
  enunciado: string
  explicacao: string | null
  alternativas: { id: number; texto: string; correta: boolean }[]
}

const paraNumero = (id: bigint) => Number(id)

function embaralhar<T>(itens: T[]): T[] {
  const resultado = [...itens]
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[resultado[i], resultado[j]] = [resultado[j], resultado[i]]
  }
  return resultado
}

export function validarAlternativas(alternativas: unknown): AlternativaEntrada[] | null {
  if (!Array.isArray(alternativas) || alternativas.length !== 4) return null
  const normalizadas = alternativas.map((a) => ({
    texto: typeof a?.texto === 'string' ? a.texto.trim() : '',
    correta: a?.correta === true,
  }))
  if (normalizadas.some((a) => !a.texto) || normalizadas.filter((a) => a.correta).length !== 1) return null
  return normalizadas
}

export async function obterQuizDoCriador(moduloId: number, userId: number) {
  const quiz = await prisma.quiz.findFirst({
    where: { id_modulo: moduloId, criado_por_id: userId },
    include: { questoes: { include: { alternativas: { orderBy: { ordem: 'asc' } } }, orderBy: { ordem: 'asc' } } },
  })
  return quiz && serializarQuiz(quiz, true)
}

export function serializarQuiz(quiz: any, incluirCorreta = false) {
  return {
    id: paraNumero(quiz.id),
    moduloId: quiz.id_modulo,
    titulo: quiz.titulo,
    descricao: quiz.descricao,
    notaMinima: quiz.nota_minima,
    status: quiz.status,
    criadoEm: quiz.criado_em,
    atualizadoEm: quiz.atualizado_em,
    questoes: quiz.questoes?.map((q: any) => ({
      id: paraNumero(q.id), enunciado: q.enunciado, explicacao: q.explicacao, ordem: q.ordem, status: q.status,
      alternativas: q.alternativas.map((a: any) => ({
        id: paraNumero(a.id), texto: a.texto, ordem: a.ordem,
        ...(incluirCorreta ? { correta: a.correta } : {}),
      })),
    })) ?? [],
  }
}

export async function validarQuizParaEnvio(quizId: bigint, exigirAprovadas: boolean) {
  const questoes = await prisma.quiz_questao.findMany({
    where: { id_quiz: quizId, ...(exigirAprovadas ? { status: 'Aprovado' } : {}) },
    include: { alternativas: true },
  })
  const validas = questoes.filter((q) => q.alternativas.length === 4 && q.alternativas.filter((a) => a.correta).length === 1)
  return { valida: validas.length >= MINIMO_QUESTOES, quantidade: validas.length }
}

export async function criarTentativa(moduloId: number, userId: number) {
  const quiz = await prisma.quiz.findFirst({
    where: { id_modulo: moduloId, status: 'Aprovado' },
    include: { questoes: { where: { status: 'Aprovado' }, include: { alternativas: true }, orderBy: { ordem: 'asc' } } },
  })
  if (!quiz) throw new Error('QUIZ_INDISPONIVEL')

  const [totalAulas, aulasConcluidas] = await Promise.all([
    prisma.aula.count({ where: { modulo_id: moduloId, status: 'Aprovado' } }),
    prisma.aluno_aula_progresso.count({ where: { id_aluno: userId, id_modulo: moduloId } }),
  ])
  if (aulasConcluidas < totalAulas) throw new Error('AULAS_PENDENTES')

  const validas = quiz.questoes.filter((q) => q.alternativas.length === 4 && q.alternativas.filter((a) => a.correta).length === 1)
  if (validas.length < MINIMO_QUESTOES) throw new Error('QUIZ_INDISPONIVEL')

  const snapshot: QuestaoSnapshot[] = embaralhar(validas).map((q) => ({
    id: paraNumero(q.id), enunciado: q.enunciado, explicacao: q.explicacao,
    alternativas: embaralhar(q.alternativas).map((a) => ({ id: paraNumero(a.id), texto: a.texto, correta: a.correta })),
  }))
  const tentativa = await prisma.quiz_tentativa.create({
    data: { id: randomUUID(), id_aluno: userId, id_quiz: quiz.id, id_modulo: moduloId, perguntas_snapshot: snapshot },
  })
  return { tentativaId: tentativa.id, quiz: { id: paraNumero(quiz.id), titulo: quiz.titulo, descricao: quiz.descricao, notaMinima: quiz.nota_minima }, questoes: ocultarGabarito(snapshot) }
}

function ocultarGabarito(snapshot: QuestaoSnapshot[]) {
  return snapshot.map(({ id, enunciado, alternativas }) => ({
    id, enunciado,
    alternativas: alternativas.map(({ id: alternativaId, texto }) => ({ id: alternativaId, texto })),
  }))
}

function recompensa(percentual: number) {
  if (percentual >= 90) return 200
  if (percentual >= 80) return 150
  if (percentual >= 70) return 100
  return 0
}

export async function finalizarTentativa(moduloId: number, tentativaId: string, userId: number, respostas: unknown) {
  if (!Array.isArray(respostas)) throw new Error('RESPOSTAS_INVALIDAS')
  const tentativa = await prisma.quiz_tentativa.findFirst({ where: { id: tentativaId, id_aluno: userId, id_modulo: moduloId }, include: { quiz: true } })
  if (!tentativa) throw new Error('TENTATIVA_NAO_ENCONTRADA')
  if (tentativa.status === 'FINALIZADA') return resultadoTentativa(tentativa)
  if (tentativa.status !== 'EM_ANDAMENTO') throw new Error('TENTATIVA_EXPIRADA')

  const snapshot = tentativa.perguntas_snapshot as unknown as QuestaoSnapshot[]
  const mapaRespostas = new Map<number, number>()
  for (const resposta of respostas) {
    const questaoId = Number(resposta?.questaoId)
    const alternativaId = Number(resposta?.alternativaId)
    if (!Number.isInteger(questaoId) || !Number.isInteger(alternativaId) || mapaRespostas.has(questaoId)) throw new Error('RESPOSTAS_INVALIDAS')
    mapaRespostas.set(questaoId, alternativaId)
  }
  const questoesValidas = new Set(snapshot.map((q) => q.id))
  if ([...mapaRespostas.keys()].some((id) => !questoesValidas.has(id))) throw new Error('RESPOSTAS_INVALIDAS')

  const acertos = snapshot.reduce((total, questao) => total + (questao.alternativas.some((a) => a.id === mapaRespostas.get(questao.id) && a.correta) ? 1 : 0), 0)
  const percentual = Math.round((acertos / snapshot.length) * 100)
  const aprovado = percentual >= tentativa.quiz.nota_minima

  const finalizada = await prisma.$transaction(async (tx) => {
    const atual = await tx.quiz_tentativa.findFirst({ where: { id: tentativaId, id_aluno: userId, status: 'EM_ANDAMENTO' } })
    if (!atual) {
      const existente = await tx.quiz_tentativa.findUnique({ where: { id: tentativaId } })
      return existente!
    }
    const resumo = await tx.aluno_modulo_quiz.findUnique({ where: { id_aluno_id_modulo: { id_aluno: userId, id_modulo: moduloId } } })
    const primeiraAprovacao = aprovado && !resumo?.primeira_aprovacao_em
    const ganho = primeiraAprovacao ? recompensa(percentual) : 0

    const registro = await tx.quiz_tentativa.update({ where: { id: tentativaId }, data: {
      status: 'FINALIZADA', finalizada_em: new Date(), acertos, total_questoes: snapshot.length, percentual, aprovado, navecoins_ganhos: ganho,
    } })
    await tx.aluno_modulo_quiz.upsert({
      where: { id_aluno_id_modulo: { id_aluno: userId, id_modulo: moduloId } },
      create: { id_aluno: userId, id_modulo: moduloId, melhor_percentual: percentual, melhor_acertos: acertos, tentativas_realizadas: 1, primeira_aprovacao_em: aprovado ? new Date() : null },
      update: { melhor_percentual: Math.max(resumo?.melhor_percentual ?? 0, percentual), melhor_acertos: Math.max(resumo?.melhor_acertos ?? 0, acertos), tentativas_realizadas: { increment: 1 }, primeira_aprovacao_em: primeiraAprovacao ? new Date() : resumo?.primeira_aprovacao_em, ultima_tentativa_em: new Date() },
    })
    if (ganho > 0) await tx.aluno.update({ where: { id: userId }, data: { pontos: { increment: ganho } } })
    if (aprovado) await tx.aluno_modulo_progresso.upsert({
      where: { id_aluno_id_modulo: { id_aluno: userId, id_modulo: moduloId } },
      create: { id_aluno: userId, id_modulo: moduloId, status_progresso: 2 },
      update: { status_progresso: 2 },
    })
    return registro
  })
  if (finalizada.status === 'FINALIZADA') verificarConquistasQuiz(userId, percentual === 100).catch(console.error)
  return resultadoTentativa(finalizada)
}

function resultadoTentativa(tentativa: any) {
  return { tentativaId: tentativa.id, acertos: tentativa.acertos, totalQuestoes: tentativa.total_questoes, percentual: tentativa.percentual, aprovado: tentativa.aprovado, navecoinsGanhos: tentativa.navecoins_ganhos, finalizadaEm: tentativa.finalizada_em }
}
