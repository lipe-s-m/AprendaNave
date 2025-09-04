import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Modulo, Trilha } from '../../models/trilha.model';
import { TRILHAS_MOCK } from '../../data/trilhas.mock';

@Injectable({
  providedIn: 'root',
})
export class TrilhaService {
  // Array privado para armazenar as trilhas com os status atualizados
  private trilhas: Trilha[] = [];

  constructor() {
    // Carregar trilhas do localStorage ou usar o mock
    this.carregarTrilhasDoLocalStorage();

    this.trilhas = this.trilhas.map((trilha) => ({
      ...trilha,
      id: trilha.id + 1,
    }));
    console.log('Trilhas carregadas:', this.trilhas);
  }

  /**
   * Salva o estado atual das trilhas no localStorage
   */
  private salvarTrilhasNoLocalStorage(): void {
    localStorage.setItem('trilhas', JSON.stringify(this.trilhas));
    console.log('Trilhas salvas no localStorage:', this.trilhas);
  }

  /**
   * Carrega as trilhas do localStorage se disponíveis, caso contrário usa os mocks
   */
  private carregarTrilhasDoLocalStorage(): void {
    const trilhasSalvas = localStorage.getItem('trilhas');

    if (trilhasSalvas) {
      try {
        this.trilhas = JSON.parse(trilhasSalvas);
        console.log('Trilhas carregadas do localStorage:', this.trilhas);
      } catch (error) {
        console.error(
          'Erro ao carregar trilhas do localStorage, usando mocks:',
          error
        );
        this.resetarTrilhas();
      }
    } else {
      this.resetarTrilhas();
    }
  }

  /**
   * Reseta as trilhas para o estado inicial dos mocks
   */
  public resetarTrilhas(): void {
    console.log('Resetando trilhas para o estado inicial dos mocks');
    this.trilhas = JSON.parse(JSON.stringify(TRILHAS_MOCK)); // Cria uma cópia profunda
    console.log('Trilhas resetadas:', this.trilhas);
    this.salvarTrilhasNoLocalStorage(); // Salva os mocks no localStorage
  }
  getTrilhas(): Observable<Trilha[]> {
    // Simula uma chamada de API com delay

    return of(this.trilhas).pipe(delay(300));
  }

  /**
   * Obter uma trilha específica pelo ID
   * @param id ID da trilha
   * @returns Observable com a trilha ou erro se não encontrada
   */
  getTrilhaById(id: number): Observable<Trilha> {
    const trilha = this.trilhas.find((t) => t.id === id);

    if (trilha) {
      // Simula uma chamada de API com delay
      return of(trilha).pipe(delay(300));
    }

    return throwError(() => new Error(`Trilha com ID ${id} não encontrada`));
  }

  /**
   * Obter dados resumidos de todas as trilhas (para listagens)
   * @returns Observable com a lista resumida de trilhas
   */
  getTrilhasResumidas(): Observable<any[]> {
    return this.getTrilhas().pipe(
      map((trilhas) =>
        trilhas.map((trilha) => ({
          id: trilha.id,
          nome: trilha.nome,
          imagem: trilha.imagem,
          matriculas: trilha.matriculas,
          professor: trilha.professor,
          tag: trilha.tag,
          modulos: trilha.modulos.length,
        }))
      )
    );
  }

  /**
   * Atualizar status de um módulo
   * @param trilhaId ID da trilha
   * @param moduloId ID do módulo
   * @param status Novo status do módulo ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO')
   * @returns Observable com a trilha atualizada
   */
  atualizarStatusModulo(
    trilhaId: number,
    moduloId: number,
    status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ): Observable<Trilha> {
    console.log(
      `Método atualizarStatusModulo chamado para trilha ${trilhaId}, módulo ${moduloId}, novo status: ${status}`
    );
    console.log('Trilhas disponíveis:', this.trilhas);

    const trilhaIndex = this.trilhas.findIndex((t) => t.id === trilhaId);

    if (trilhaIndex === -1) {
      console.error(`Trilha com ID ${trilhaId} não encontrada`);
      return throwError(
        () => new Error(`Trilha com ID ${trilhaId} não encontrada`)
      );
    }

    const trilha = this.trilhas[trilhaIndex];
    console.log('Trilha encontrada:', trilha);

    const moduloIndex = trilha.modulos.findIndex(
      (m: Modulo) => m.id === moduloId
    );

    if (moduloIndex === -1) {
      console.error(
        `Módulo com ID ${moduloId} não encontrado na trilha ${trilhaId}`
      );
      return throwError(
        () =>
          new Error(
            `Módulo com ID ${moduloId} não encontrado na trilha ${trilhaId}`
          )
      );
    }

    // Atualiza o status do módulo
    console.log(
      `Atualizando módulo ${moduloId} da trilha ${trilhaId} para status: ${status}`
    );
    trilha.modulos[moduloIndex].status = status;
    console.log('Módulo após atualização:', trilha.modulos[moduloIndex]);

    // Atualiza o array de trilhas
    this.trilhas[trilhaIndex] = trilha;

    // Salva as alterações no localStorage
    this.salvarTrilhasNoLocalStorage();

    // Simula uma chamada de API com delay
    return of(trilha).pipe(delay(300));
  }

  /**
   * Atualizar status de uma aula
   * @param trilhaId ID da trilha
   * @param moduloId ID do módulo
   * @param aulaId ID da aula
   * @param concluida Status de conclusão da aula
   * @returns Observable com a trilha atualizada
   */
  atualizarStatusAula(
    trilhaId: number,
    moduloId: number,
    aulaId: number,
    concluida: boolean
  ): Observable<Trilha> {
    console.log(
      `Atualizando status da aula ${aulaId} do módulo ${moduloId} na trilha ${trilhaId} para ${
        concluida ? 'concluída' : 'não concluída'
      }`
    );

    const trilhaIndex = this.trilhas.findIndex((t) => t.id === trilhaId);

    if (trilhaIndex === -1) {
      console.error(`Trilha com ID ${trilhaId} não encontrada`);
      return throwError(
        () => new Error(`Trilha com ID ${trilhaId} não encontrada`)
      );
    }

    const trilha = this.trilhas[trilhaIndex];
    const moduloIndex = trilha.modulos.findIndex((m) => m.id === moduloId);

    if (moduloIndex === -1) {
      console.error(
        `Módulo com ID ${moduloId} não encontrado na trilha ${trilhaId}`
      );
      return throwError(
        () =>
          new Error(
            `Módulo com ID ${moduloId} não encontrado na trilha ${trilhaId}`
          )
      );
    }

    const modulo = trilha.modulos[moduloIndex];

    // Inicializa aulasList se ainda não existir
    if (!modulo.aulasList) {
      modulo.aulasList = [];
    }

    const aulaIndex = modulo.aulasList.findIndex((a) => a.id === aulaId);

    if (aulaIndex === -1) {
      console.log(
        `Aula com ID ${aulaId} não encontrada, adicionando ao módulo`
      );
      // Se a aula não existir ainda, adiciona ao módulo
      modulo.aulasList.push({
        id: aulaId,
        titulo: `Aula ${aulaId}`,
        duracao: '00:00',
        concluida: concluida,
      });
    } else {
      // Atualiza o status da aula
      modulo.aulasList[aulaIndex].concluida = concluida;
    }

    // Se todas as aulas estiverem concluídas, marca o módulo como concluído
    const todasAulasConcluidas = modulo.aulasList.every((a) => a.concluida);
    if (todasAulasConcluidas && modulo.aulasList.length > 0) {
      modulo.status = 'CONCLUIDO';
    } else if (modulo.aulasList.some((a) => a.concluida)) {
      modulo.status = 'EM_ANDAMENTO';
    }

    // Salva as alterações no localStorage
    this.salvarTrilhasNoLocalStorage();

    // Simula uma chamada de API com delay
    return of(trilha).pipe(delay(300));
  }
}
