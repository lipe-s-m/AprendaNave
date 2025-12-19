import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Modulo, Curso } from '../../models/curso.model';
import { AulaDTO } from '../../shared/interfaces/aulas';

@Injectable({
  providedIn: 'root',
})
export class TrilhaService {
  // Array privado para armazenar as trilhas com os status atualizados
  private cursos: Curso[] = [];

  constructor() {
    // Carregar cursos do localStorage ou usar o mock
    this.carregarCursosDoLocalStorage();

    this.cursos = this.cursos.map((curso) => ({
      ...curso,
      id: curso.id,
    }));
  }

  /**
   * Salva o estado atual dos cursos no localStorage
   */
  private salvarCursosNoLocalStorage(): void {
    // localStorage.setItem('cursos', JSON.stringify(this.cursos));
  }

  /**
   * Carrega os cursos do localStorage se disponíveis, caso contrário usa os mocks
   */
  private carregarCursosDoLocalStorage(): void {
    const cursosSalvos = localStorage.getItem('cursos');

    if (cursosSalvos) {
      try {
        this.cursos = JSON.parse(cursosSalvos);
      } catch (error) {
        console.error(
          'Erro ao carregar cursos do localStorage, usando mocks:',
          error
        );
        this.resetarCursos();
      }
    } else {
      this.resetarCursos();
    }
  }

  /**
   * Reseta os cursos para o estado inicial dos mocks
   */
  public resetarCursos(): void {
    this.cursos = JSON.parse(JSON.stringify([])); // Cria uma cópia profunda
    this.salvarCursosNoLocalStorage(); // Salva os mocks no localStorage
  }
  getCursos(): Observable<Curso[]> {
    // Simula uma chamada de API com delay

    return of(this.cursos).pipe(delay(300));
  }

  /**
   * Obter um curso específico pelo ID
   * @param id ID do curso
   * @returns Observable com o curso ou erro se não encontrado
   */
  getCursoById(id: number): Observable<Curso> {
    const curso = this.cursos.find((t) => t.id === id);

    if (curso) {
      // Simula uma chamada de API com delay
      return of(curso).pipe(delay(300));
    }

    return throwError(() => new Error(`Curso com ID ${id} não encontrado`));
  }

  /**
   * Obter dados resumidos de todos os cursos (para listagens)
   * @returns Observable com a lista resumida de cursos
   */
  getCursosResumidos(): Observable<any[]> {
    return this.getCursos().pipe(
      map((cursos) =>
        cursos.map((curso) => ({
          id: curso.id,
          nome: curso.nome,
          imagem: curso.logo,
          professor: curso.professor,
          tag: curso.tag,
          modulos: curso.modulos.length,
        }))
      )
    );
  }

  /**
   * Atualizar status de um módulo
   * @param cursoId ID do curso
   * @param moduloId ID do módulo
   * @param status Novo status do módulo ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO')
   * @returns Observable com o curso atualizado
   */
  atualizarStatusModulo(
    cursoId: number,
    moduloId: number,
    status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ): Observable<Curso> {
    const cursoIndex = this.cursos.findIndex((c) => c.id === cursoId);

    if (cursoIndex === -1) {
      console.error(`Curso com ID ${cursoId} não encontrado`);
      return throwError(
        () => new Error(`Curso com ID ${cursoId} não encontrado`)
      );
    }

    const curso = this.cursos[cursoIndex];

    const moduloIndex = curso.modulos.findIndex(
      (m: Modulo) => m.id === moduloId
    );

    if (moduloIndex === -1) {
      console.error(
        `Módulo com ID ${moduloId} não encontrado no curso ${cursoId}`
      );
      return throwError(
        () =>
          new Error(
            `Módulo com ID ${moduloId} não encontrado no curso ${cursoId}`
          )
      );
    }

    // Atualiza o status do módulo
    curso.modulos[moduloIndex].status = status;

    // Atualiza o array de cursos
    this.cursos[cursoIndex] = curso;

    // Salva as alterações no localStorage
    this.salvarCursosNoLocalStorage();

    // Simula uma chamada de API com delay
    return of(curso).pipe(delay(300));
  }

  /**
   * Atualizar status de uma aula
   * @param cursoId ID do curso
   * @param moduloId ID do módulo
   * @param aulaId ID da aula
   * @param concluida Status de conclusão da aula
   * @returns Observable com o curso atualizado
   */
  atualizarStatusAula(
    cursoId: number,
    moduloId: number,
    aulaId: number,
    concluida: boolean
  ): Observable<Curso> {
    const cursoIndex = this.cursos.findIndex((c) => c.id === cursoId);

    if (cursoIndex === -1) {
      console.error(`Curso com ID ${cursoId} não encontrado`);
      return throwError(
        () => new Error(`Curso com ID ${cursoId} não encontrado`)
      );
    }

    const curso = this.cursos[cursoIndex];
    const moduloIndex = curso.modulos.findIndex(
      (m: Modulo) => m.id === moduloId
    );

    if (moduloIndex === -1) {
      console.error(
        `Módulo com ID ${moduloId} não encontrado no curso ${cursoId}`
      );
      return throwError(
        () =>
          new Error(
            `Módulo com ID ${moduloId} não encontrado no curso ${cursoId}`
          )
      );
    }

    const modulo = curso.modulos[moduloIndex];

    // Inicializa aulasList se ainda não existir
    if (!modulo.aulasList) {
      modulo.aulasList = [];
    }

    const aulaIndex = modulo.aulasList.findIndex(
      (a: AulaDTO) => a.idAula === aulaId
    );

    if (aulaIndex === -1) {
      // Se a aula não existir ainda, adiciona ao módulo
      modulo.aulasList.push({
        idAula: aulaId,
        tituloAula: `Aula ${aulaId}`,
        duracaoAula: 0,
        concluida: concluida,
        videoYoutubeIdAula: '',
        idModulo: moduloId,
        ordemAula: 0,
        descricaoAula: '',
      });
    } else {
      // Atualiza o status da aula
      modulo.aulasList[aulaIndex].concluida = concluida;
    }

    // Se todas as aulas estiverem concluídas, marca o módulo como concluído
    const todasAulasConcluidas = modulo.aulasList.every(
      (a: AulaDTO) => a.concluida
    );
    if (todasAulasConcluidas && modulo.aulasList.length > 0) {
      modulo.status = 'CONCLUIDO';
    } else if (modulo.aulasList.some((a: AulaDTO) => a.concluida)) {
      modulo.status = 'EM_ANDAMENTO';
    }

    // Salva as alterações no localStorage
    this.salvarCursosNoLocalStorage();

    // Simula uma chamada de API com delay
    return of(curso).pipe(delay(300));
  }
}
