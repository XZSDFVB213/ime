import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  status: string;

  roles: string[];
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(dto: { email: string; password: string }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.api}/auth/login`, dto, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
        }),
      );
  }

  refresh(): Observable<RefreshResponse> {
    return this.http
      .post<RefreshResponse>(
        `${environment.api}/auth/refresh`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => {
          this.setAccessToken(response.accessToken);
        }),
      );
  }

  me() {
    return this.http.get<any>(`${environment.api}/auth/me`, {
      withCredentials: true,
    });
  }

  logout() {
    return this.http
      .post(
        `${environment.api}/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap(() => {
          this.clearSession();
        }),
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
  }
}
