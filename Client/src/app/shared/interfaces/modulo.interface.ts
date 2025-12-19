export interface IModulo {
  id: number;
  nome: string;
  status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  aulas: number;
  duracao: string;
  descricao?: string;
  nivel?: 'INICIANTE' | 'INTERMEDIÁRIO' | 'AVANÇADO';
}

export interface IPlaylistVideos {
  videoId: string;
  titulo: string;
  descricao: string;
  posicao: number;
  thumbnailUrl: string;
}
