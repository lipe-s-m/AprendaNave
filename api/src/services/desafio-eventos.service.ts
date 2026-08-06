import { createHash, randomUUID } from 'crypto'
import prisma from '../lib/prisma'

const LIMITE_NOME = 100
const EXPIRACAO_GUEST_MS = 24 * 60 * 60 * 1000

function hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }
function numero(id: bigint) { return Number(id) }

export function eventoEstaJogavel(evento: { status: string; jogo_habilitado: boolean; inicio_em: Date | null; fim_em: Date | null }) {
  const agora = Date.now()
  return evento.status === 'ATIVO' && evento.jogo_habilitado && (!evento.inicio_em || evento.inicio_em.getTime() <= agora) && (!evento.fim_em || evento.fim_em.getTime() >= agora)
}

export async function buscarEvento(slug: string) {
  return prisma.desafio_evento.findUnique({ where: { slug } })
}

function serializarEvento(evento: any) {
  return { id: numero(evento.id), slug: evento.slug, nome: evento.nome, descricao: evento.descricao, status: evento.status, jogoHabilitado: evento.jogo_habilitado, inicioEm: evento.inicio_em, fimEm: evento.fim_em, podeJogar: eventoEstaJogavel(evento) }
}

export async function obterRankingEvento(eventoId: bigint, limite = 10) {
  const scores = await prisma.desafio_evento_score.findMany({
    where: { id_evento: eventoId }, include: { participante: { select: { nome_snapshot: true } } },
    orderBy: [{ melhor_pontuacao: 'desc' }, { atualizado_em: 'asc' }], take: limite,
  })
  const totalParticipantes = await prisma.desafio_evento_score.count({ where: { id_evento: eventoId } })
  let posicaoAnterior = 0, scoreAnterior: number | null = null
  const entradas = scores.map((score, indice) => {
    const posicao = score.melhor_pontuacao === scoreAnterior ? posicaoAnterior : indice + 1
    scoreAnterior = score.melhor_pontuacao; posicaoAnterior = posicao
    return { posicao, nome: score.participante.nome_snapshot, pontos: score.melhor_pontuacao, atualizadoEm: score.atualizado_em ?? score.criado_em }
  })
  return { entradas, totalParticipantes }
}

export async function obterEventoPublico(slug: string, limite = 10) {
  const evento = await buscarEvento(slug)
  if (!evento) return null
  return { evento: serializarEvento(evento), ...(await obterRankingEvento(evento.id, limite)) }
}

export async function criarParticipacaoGuest(evento: any, nomeEntrada: unknown, contatoEntrada: unknown) {
  if (!eventoEstaJogavel(evento)) throw new Error('EVENTO_ENCERRADO')
  const nome = typeof nomeEntrada === 'string' ? nomeEntrada.trim() : ''
  const contato = typeof contatoEntrada === 'string' ? contatoEntrada.trim() : ''
  if (!nome || nome.length > LIMITE_NOME || !contato || contato.length > 150) throw new Error('DADOS_INVALIDOS')
  const tokenSessao = randomUUID()
  const guest = await prisma.guest_user.create({ data: { nome, contato, created_at: new Date(), last_updated_at: new Date() } })
  const participacao = await prisma.desafio_evento_participante.create({
    data: { id: randomUUID(), id_evento: evento.id, tipo_pessoa: 'GUEST', id_pessoa: guest.id, nome_snapshot: nome, token_sessao_hash: hashToken(tokenSessao), expira_em: new Date(Date.now() + EXPIRACAO_GUEST_MS) },
  })
  return { participacaoId: participacao.id, tokenSessao, nome: participacao.nome_snapshot, expiraEm: participacao.expira_em }
}

export async function obterOuCriarParticipacaoAluno(evento: any, alunoId: number) {
  if (!eventoEstaJogavel(evento)) throw new Error('EVENTO_ENCERRADO')
  const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { nome: true } })
  if (!aluno) throw new Error('ALUNO_NAO_ENCONTRADO')
  const existente = await prisma.desafio_evento_participante.findUnique({ where: { id_evento_tipo_pessoa_id_pessoa: { id_evento: evento.id, tipo_pessoa: 'ALUNO', id_pessoa: alunoId } } })
  if (existente) return { participacaoId: existente.id, nome: existente.nome_snapshot }
  const participacao = await prisma.desafio_evento_participante.create({ data: { id: randomUUID(), id_evento: evento.id, tipo_pessoa: 'ALUNO', id_pessoa: alunoId, nome_snapshot: aluno.nome } })
  return { participacaoId: participacao.id, nome: participacao.nome_snapshot }
}

export async function validarParticipacao(evento: any, alunoId: number | null, tokenSessao: string | undefined) {
  if (!eventoEstaJogavel(evento)) throw new Error('EVENTO_ENCERRADO')
  if (alunoId !== null) {
    const participacao = await prisma.desafio_evento_participante.findUnique({ where: { id_evento_tipo_pessoa_id_pessoa: { id_evento: evento.id, tipo_pessoa: 'ALUNO', id_pessoa: alunoId } } })
    if (!participacao) throw new Error('PARTICIPACAO_NAO_ENCONTRADA')
    return participacao
  }
  if (!tokenSessao) throw new Error('SESSAO_INVALIDA')
  const participacao = await prisma.desafio_evento_participante.findFirst({ where: { id_evento: evento.id, tipo_pessoa: 'GUEST', token_sessao_hash: hashToken(tokenSessao), expira_em: { gt: new Date() } } })
  if (!participacao) throw new Error('SESSAO_INVALIDA')
  return participacao
}

export async function registrarMelhorScore(evento: any, participacao: any, pontos: unknown) {
  const pontosNumero = typeof pontos === 'number' ? pontos : Number.NaN
  if (!Number.isInteger(pontosNumero) || pontosNumero < 0 || pontosNumero > 100000) throw new Error('PONTUACAO_INVALIDA')
  const anterior = await prisma.desafio_evento_score.findUnique({ where: { id_evento_id_participante: { id_evento: evento.id, id_participante: participacao.id } } })
  if (!anterior) {
    await prisma.desafio_evento_score.create({ data: { id_evento: evento.id, id_participante: participacao.id, melhor_pontuacao: pontosNumero } })
    return { melhorou: true, melhorPontuacao: pontosNumero }
  }
  if (pontosNumero > anterior.melhor_pontuacao) {
    const atualizado = await prisma.desafio_evento_score.update({ where: { id_evento_id_participante: { id_evento: evento.id, id_participante: participacao.id } }, data: { melhor_pontuacao: pontosNumero, atualizado_em: new Date() } })
    return { melhorou: true, melhorPontuacao: atualizado.melhor_pontuacao }
  }
  return { melhorou: false, melhorPontuacao: anterior.melhor_pontuacao }
}
