export interface RankingCategoria {
  slug: string;
  nome: string;
  descricao: string;
  icone: string;
  unidade: string;
}

export interface RankingEntrada {
  posicao: number;
  idAluno: number;
  nomeAluno: string;
  fotoPerfil: string | null;
  valor: number;
}

export interface RankingResposta {
  categoria: RankingCategoria;
  entradas: RankingEntrada[];
  totalParticipantes: number;
  meuRanking: RankingEntrada | null;
}

export interface RegistrarResultadoResposta {
  melhorou: boolean;
  melhorPontuacao: number;
}
