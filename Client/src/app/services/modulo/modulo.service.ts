import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EMPTY, map, Observable, shareReplay, tap } from 'rxjs';
import { IModulo } from '../../shared/interfaces/curso.model';
import { IPlaylistVideos } from '../../shared/interfaces/modulo.interface';

@Injectable({
  providedIn: 'root',
})
export class ModuloService {
  private apiUrl = environment.apiUrl;
  private moduloCache$: Observable<IModulo[] | null> = EMPTY;
  constructor(private http: HttpClient) {}

  getModulos(cursoId: number): Observable<IModulo[] | null> {
    // if (this.moduloCache$ === EMPTY) {
    this.moduloCache$ = this.http
      .get<IModulo[]>(`${this.apiUrl}/cursos/modulos?cursoId=${cursoId}`)
      .pipe(
        tap(() =>
          console.log(
            `[Cache]: Requisição HTTP REALIZADA para cursoId ${cursoId}`
          )
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    // }
    return this.moduloCache$;
  }
  getVideosPlaylistUrl(playlistUrl: string): Observable<any> {
    const response = this.http.get(
      'https://www.googleapis.com/youtube/v3/playlistItems',
      {
        params: {
          part: 'snippet,contentDetails',
          maxResults: '20',
          playlistId: playlistUrl,
          key: 'AIzaSyBusuLBAeE0fIgkezIROFhbkArIB_CUlq8',
        },
      }
    );
    const payload: IPlaylistVideos[] = [];
    return response.pipe(
      tap((res: any) => {
        res.items.forEach((item: any) => {
          payload.push({
            videoId: item.snippet.resourceId.videoId,
            titulo: item.snippet.title,
            descricao: item.snippet.description,
            posicao: item.snippet.position,
            thumbnailUrl: item.snippet.thumbnails.default.url,
          });
        });
      }),
      map(() => payload)
    );
  }
  clearCache(): void {
    this.moduloCache$ = EMPTY;
  }
}
