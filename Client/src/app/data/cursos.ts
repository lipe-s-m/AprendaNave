import { Curso } from '../shared/interfaces/curso.model';
import { CursoService } from '../services/curso/curso.service';

export class Cursos {
  cursosList: any;
  constructor(private cursoService: CursoService) {
    this.cursosList = this.getCursos();
  }
  // cursosList: Curso[] = [];

  getCursos() {
    return this.cursoService.getCursos();
  }
}

export const CURSOS_MOCK: Curso[] = [];
