import prisma from '../lib/prisma'
import { getRankingCategoria, RankingCategoria, RankingSlug } from '../lib/ranking-categorias'

export type RankingEntrada = { posicao: number; idAluno: number; nomeAluno: string; fotoPerfil: string | null; valor: number }
export type RankingResposta = { categoria: RankingCategoria; entradas: RankingEntrada[]; totalParticipantes: number; meuRanking: RankingEntrada | null }

type RankingValor = {
  idAluno: number
  valor: number
  origem: 'aluno' | 'guest'
  /** Nome gravado no score legado; permite confirmar a identidade do guest. */
  nomeReferencia?: string
}

type PeriodoArcade = 'diario' | 'semanal'

/**
 * A pontuação é associada ao calendário de São Paulo, e não ao UTC do servidor.
 * Assim, o ranking diário vira à meia-noite local e o semanal usa a semana ISO.
 */
function dataSaoPaulo(agora = new Date()): { ano: number; mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora)
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => Number(partes.find((parte) => parte.type === tipo)?.value)
  return { ano: valor('year'), mes: valor('month'), dia: valor('day') }
}

function semanaIso(ano: number, mes: number, dia: number): { ano: number; semana: number } {
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  const diaDaSemana = data.getUTCDay() || 7
  data.setUTCDate(data.getUTCDate() + 4 - diaDaSemana)
  const anoIso = data.getUTCFullYear()
  const inicioAno = new Date(Date.UTC(anoIso, 0, 1))
  const semana = Math.ceil((((data.getTime() - inicioAno.getTime()) / 86_400_000) + 1) / 7)
  return { ano: anoIso, semana }
}

export function chavePeriodoArcade(periodo: PeriodoArcade, agora = new Date()): string {
  const { ano, mes, dia } = dataSaoPaulo(agora)
  if (periodo === 'diario') {
    return `arcade-matematica:diario:${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }
  const iso = semanaIso(ano, mes, dia)
  return `arcade-matematica:semanal:${iso.ano}-W${String(iso.semana).padStart(2, '0')}`
}

/** Valor por aluno de uma categoria, calculado a partir da fonte de verdade. */
async function obterValoresPorCategoria(slug: RankingSlug): Promise<RankingValor[]> {
  switch (slug) {
    case 'desafio-matematica': {
      // O ranking novo guarda somente usuários autenticados. O legado contém
      // convidados e deve continuar aparecendo enquanto esses registros existirem.
      const [atuais, legados] = await Promise.all([
        prisma.ranking_melhor_pontuacao.findMany({ where: { categoria: slug } }),
        prisma.desafio_jcc.findMany(),
      ])
      const idsLegados = [...new Set(legados.map((r) => r.id_aluno))]
      const guests = idsLegados.length ? await prisma.guest_user.findMany({ where: { id: { in: idsLegados } }, select: { id: true, nome: true } }) : []
      const guestPorId = new Map(guests.map((g) => [g.id, g.nome]))
      const melhores = new Map<string, RankingValor>()

      for (const score of legados) {
        // Regra de desambiguação: somente é convidado se ID E nome coincidirem.
        // Se houver colisão de ID mas o nome não coincidir, é tratado como aluno.
        const origem: RankingValor['origem'] = guestPorId.get(score.id_aluno) === score.nome_aluno ? 'guest' : 'aluno'
        const chave = `${origem}:${score.id_aluno}`
        const anterior = melhores.get(chave)
        if (!anterior || score.pontos > anterior.valor) {
          melhores.set(chave, { idAluno: score.id_aluno, valor: score.pontos, origem, nomeReferencia: score.nome_aluno })
        }
      }
      for (const score of atuais) {
        // Um registro legado confirmado como guest tem prioridade sobre a linha
        // sem nome da tabela nova. Isso evita duplicar "guest 21" e "aluno 21".
        if (melhores.has(`guest:${score.id_aluno}`)) continue
        const chave = `aluno:${score.id_aluno}`
        const anterior = melhores.get(chave)
        if (!anterior || score.pontos > anterior.valor) {
          melhores.set(chave, { idAluno: score.id_aluno, valor: score.pontos, origem: 'aluno' })
        }
      }
      return [...melhores.values()]
    }
    case 'desafio-arcade-diario':
    case 'desafio-arcade-semanal': {
      const periodo: PeriodoArcade = slug === 'desafio-arcade-diario' ? 'diario' : 'semanal'
      const pontuacoes = await prisma.ranking_melhor_pontuacao.findMany({
        where: { categoria: chavePeriodoArcade(periodo) },
      })
      return pontuacoes.map((pontuacao) => ({
        idAluno: pontuacao.id_aluno,
        valor: pontuacao.pontos,
        origem: 'aluno' as const,
      }))
    }
    case 'navecoins': {
      const alunos = await prisma.aluno.findMany({ where: { pontos: { gt: 0 } }, orderBy: [{ pontos: 'desc' }, { id: 'asc' }] })
      return alunos.map((a) => ({ idAluno: a.id, valor: a.pontos, origem: 'aluno' as const }))
    }
    case 'aulas-concluidas': {
      const grupos = await prisma.aluno_aula_progresso.groupBy({ by: ['id_aluno'], _count: { _all: true } })
      return grupos.map((g) => ({ idAluno: g.id_aluno, valor: g._count._all, origem: 'aluno' as const }))
    }
    case 'modulos-concluidos': {
      const grupos = await prisma.aluno_modulo_progresso.groupBy({ by: ['id_aluno'], where: { status_progresso: 2 }, _count: { _all: true } })
      return grupos.map((g) => ({ idAluno: g.id_aluno, valor: g._count._all, origem: 'aluno' as const }))
    }
    case 'conquistas': {
      const grupos = await prisma.aluno_conquista.groupBy({ by: ['id_aluno'], _count: { _all: true } })
      return grupos.map((g) => ({ idAluno: g.id_aluno, valor: g._count._all, origem: 'aluno' as const }))
    }
  }
}

function calcularPosicoes(ordenados: RankingValor[]): (RankingValor & { posicao: number })[] {
  let posicaoAnterior = 0
  let valorAnterior: number | null = null
  return ordenados.map((item, indice) => {
    const posicao = item.valor === valorAnterior ? posicaoAnterior : indice + 1
    valorAnterior = item.valor
    posicaoAnterior = posicao
    return { ...item, posicao }
  })
}

export async function obterRanking(slug: RankingSlug, currentUserId: number | null, limite: number): Promise<RankingResposta> {
  const categoria = getRankingCategoria(slug)!
  const valores = await obterValoresPorCategoria(slug)
  valores.sort((a, b) => b.valor - a.valor || a.idAluno - b.idAluno || a.origem.localeCompare(b.origem))
  const comPosicoes = calcularPosicoes(valores)

  // Nunca procurar um guest em aluno só porque os IDs são iguais.
  const idsAlunos = comPosicoes.filter((v) => v.origem === 'aluno').map((v) => v.idAluno)
  const idsGuests = comPosicoes.filter((v) => v.origem === 'guest').map((v) => v.idAluno)
  const [alunos, guests] = await Promise.all([
    idsAlunos.length ? prisma.aluno.findMany({ where: { id: { in: idsAlunos } }, select: { id: true, nome: true, foto_perfil: true } }) : [],
    idsGuests.length ? prisma.guest_user.findMany({ where: { id: { in: idsGuests } }, select: { id: true, nome: true } }) : [],
  ])
  const alunoPorId = new Map(alunos.map((a) => [a.id, a]))
  const guestPorId = new Map(guests.map((g) => [g.id, g]))
  const montarEntrada = (item: RankingValor & { posicao: number }): RankingEntrada => {
    const aluno = item.origem === 'aluno' ? alunoPorId.get(item.idAluno) : undefined
    const guest = item.origem === 'guest' ? guestPorId.get(item.idAluno) : undefined
    return { posicao: item.posicao, idAluno: item.idAluno, nomeAluno: guest?.nome ?? aluno?.nome ?? item.nomeReferencia ?? 'Aluno', fotoPerfil: aluno?.foto_perfil ?? null, valor: item.valor }
  }
  const entradas = comPosicoes.slice(0, limite).map(montarEntrada)
  const entradaDoUsuario = currentUserId === null ? undefined : comPosicoes.find((v) => v.origem === 'aluno' && v.idAluno === currentUserId)
  return { categoria, entradas, totalParticipantes: comPosicoes.length, meuRanking: entradaDoUsuario ? montarEntrada(entradaDoUsuario) : null }
}

export async function registrarMelhorPontuacao(userId: number, categoria: string, pontos: number): Promise<{ melhorou: boolean; melhorPontuacao: number }> {
  if (!Number.isInteger(pontos) || pontos < 0) throw new Error('Pontuação inválida: deve ser um inteiro maior ou igual a 0')
  const existente = await prisma.ranking_melhor_pontuacao.findFirst({ where: { id_aluno: userId, categoria } })
  if (!existente) {
    await prisma.ranking_melhor_pontuacao.create({ data: { id_aluno: userId, categoria, pontos, criado_em: new Date() } })
    return { melhorou: true, melhorPontuacao: pontos }
  }
  if (pontos > existente.pontos) {
    const atualizado = await prisma.ranking_melhor_pontuacao.update({ where: { id: existente.id }, data: { pontos, atualizado_em: new Date() } })
    return { melhorou: true, melhorPontuacao: atualizado.pontos }
  }
  return { melhorou: false, melhorPontuacao: existente.pontos }
}

/** Registra uma mesma partida nos rankings diário e semanal vigentes. */
export async function registrarResultadoArcade(userId: number, pontos: number) {
  const [diario, semanal] = await Promise.all([
    registrarMelhorPontuacao(userId, chavePeriodoArcade('diario'), pontos),
    registrarMelhorPontuacao(userId, chavePeriodoArcade('semanal'), pontos),
  ])
  return { diario, semanal }
}
