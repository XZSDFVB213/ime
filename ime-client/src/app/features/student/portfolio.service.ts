import {
  inject,
  Injectable,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  environment,
} from '../../environments/environment';


export type PortfolioItemType =
  | 'PROJECT'
  | 'COURSEWORK'
  | 'RESEARCH'
  | 'PRESENTATION'
  | 'CERTIFICATE'
  | 'DIPLOMA'
  | 'OTHER';


export interface PortfolioSubject {
  id: string;
  name: string;
  code?: string | null;
}


export interface PortfolioItem {
  id: string;

  title: string;

  description?: string | null;

  type: PortfolioItemType;

  url?: string | null;

  fileName?: string | null;

  mimeType?: string | null;

  size?: number | null;

  studentId: string;

  subjectId?: string | null;

  subject?: PortfolioSubject | null;

  createdAt: string;

  updatedAt: string;
}


export interface CreatePortfolioLinkDto {
  title: string;

  description?: string;

  type: PortfolioItemType;

  subjectId?: string;

  url: string;
}


@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly http =
    inject(HttpClient);


  getPortfolio() {
    return this.http.get<
      PortfolioItem[]
    >(
      `${environment.api}/portfolio`,
    );
  }


  createLink(
    dto: CreatePortfolioLinkDto,
  ) {
    return this.http.post<
      PortfolioItem
    >(
      `${environment.api}/portfolio/link`,
      dto,
    );
  }


  createFile(
    data: {
      title: string;
      description?: string;
      type: PortfolioItemType;
      subjectId?: string;
    },

    file: File,
  ) {
    const formData =
      new FormData();


    formData.append(
      'title',
      data.title,
    );

    formData.append(
      'type',
      data.type,
    );


    if (data.description) {
      formData.append(
        'description',
        data.description,
      );
    }


    if (data.subjectId) {
      formData.append(
        'subjectId',
        data.subjectId,
      );
    }


    formData.append(
      'file',
      file,
    );


    return this.http.post<
      PortfolioItem
    >(
      `${environment.api}/portfolio/file`,
      formData,
    );
  }


  deleteItem(
    itemId: string,
  ) {
    return this.http.delete<{
      success: boolean;
    }>(
      `${environment.api}/portfolio/${itemId}`,
    );
  }


  /*
   * Для файлов backend возвращает:
   *
   * /uploads/portfolio/...
   *
   * поэтому превращаем путь
   * в полный URL API.
   *
   * Для внешней ссылки ничего
   * менять не надо.
   */
  resolveUrl(
    url?: string | null,
  ): string | null {
    if (!url) {
      return null;
    }


    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }


    const api =
      environment.api.endsWith('/')
        ? environment.api.slice(0, -1)
        : environment.api;


    const path =
      url.startsWith('/')
        ? url
        : `/${url}`;


    return `${api}${path}`;
  }
}