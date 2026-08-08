export type RankingSlug =
  | 'desafio-matematica'
  | 'desafio-arcade-diario'
  | 'desafio-arcade-semanal'
  | 'navecoins'
  | 'aulas-concluidas'
  | 'modulos-concluidos'
  | 'conquistas'

export type RankingCategoria = {
  slug: RankingSlug
  nome: string
  descricao: string
  icone: string
  unidade: string
  tipo: 'melhor-pontuacao' | 'agregado'
}

/**
 * Catálogo central de categorias do ranking.
 * O frontend NUNCA inventa uma categoria por string livre — tudo passa por aqui.
 */
export const RANKING_CATEGORIAS: RankingCategoria[] = [
  {
    slug: 'desafio-matematica',
    nome: 'Desafio Matemática',
    descricao: 'Quem alcançou a maior pontuação em uma partida.',
    icone: 'calculate',
    unidade: 'pontos',
    tipo: 'melhor-pontuacao',
  },
  {
    slug: 'desafio-arcade-diario',
    nome: 'Arcade — hoje',
    descricao: 'A melhor partida de cada pessoa no Desafio Matemático Arcade de hoje.',
    icone: 'sports_esports',
    unidade: 'pontos',
    tipo: 'melhor-pontuacao',
  },
  {
    slug: 'desafio-arcade-semanal',
    nome: 'Arcade — semana',
    descricao: 'A melhor partida de cada pessoa no Desafio Matemático Arcade nesta semana.',
    icone: 'emoji_events',
    unidade: 'pontos',
    tipo: 'melhor-pontuacao',
  },
  {
    slug: 'navecoins',
    nome: 'Navecoins',
    descricao: 'Quem acumulou mais Navecoins estudando.',
    icone: 'monetization_on',
    unidade: 'Navecoins',
    tipo: 'agregado',
  },
  {
    slug: 'aulas-concluidas',
    nome: 'Aulas concluídas',
    descricao: 'Quem concluiu mais aulas.',
    icone: 'play_circle',
    unidade: 'aulas',
    tipo: 'agregado',
  },
  {
    slug: 'modulos-concluidos',
    nome: 'Módulos concluídos',
    descricao: 'Quem concluiu mais módulos.',
    icone: 'flag',
    unidade: 'módulos',
    tipo: 'agregado',
  },
  {
    slug: 'conquistas',
    nome: 'Conquistas',
    descricao: 'Quem desbloqueou mais conquistas.',
    icone: 'emoji_events',
    unidade: 'conquistas',
    tipo: 'agregado',
  },
]

export function getRankingCategoria(slug: string | undefined): RankingCategoria | null {
  if (!slug) return null
  return RANKING_CATEGORIAS.find((c) => c.slug === slug) ?? null
}

export function isRankingSlug(slug: string): slug is RankingSlug {
  return RANKING_CATEGORIAS.some((c) => c.slug === slug)
}
