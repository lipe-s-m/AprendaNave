export interface AulaDTO {
  id: number;
  titulo: string;
  duracao?: string;
  descricao: string;
  ordem: number;
  videoYoutubeId: string;
  moduloId: number;
}
