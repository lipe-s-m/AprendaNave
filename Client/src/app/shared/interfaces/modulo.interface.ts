export interface IModulo {
  id: number;
  nome: string;
  status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  aulas: number;
  duracao: string;
  descricao?: string;
  nivel?: 'INICIANTE' | 'INTERMEDIÁRIO' | 'AVANÇADO';
}
