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

export async function registrarMelhorPontuacao(userId: number, slug: 'desafio-matematica', pontos: number): Promise<{ melhorou: boolean; melhorPontuacao: number }> {
  if (!Number.isInteger(pontos) || pontos < 0) throw new Error('Pontuação inválida: deve ser um inteiro maior ou igual a 0')
  const existente = await prisma.ranking_melhor_pontuacao.findFirst({ where: { id_aluno: userId, categoria: slug } })
  if (!existente) {
    await prisma.ranking_melhor_pontuacao.create({ data: { id_aluno: userId, categoria: slug, pontos, criado_em: new Date() } })
    return { melhorou: true, melhorPontuacao: pontos }
  }
  if (pontos > existente.pontos) {
    const atualizado = await prisma.ranking_melhor_pontuacao.update({ where: { id: existente.id }, data: { pontos, atualizado_em: new Date() } })
    return { melhorou: true, melhorPontuacao: atualizado.pontos }
  }
  return { melhorou: false, melhorPontuacao: existente.pontos }
}
