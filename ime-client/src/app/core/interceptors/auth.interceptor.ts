import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';

import {
  inject,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import {
  AuthService,
  RefreshResponse,
} from '../../features/auth/auth.service';


let refreshRequest:
  Observable<RefreshResponse> |
  null = null;


export const authInterceptor:
  HttpInterceptorFn =
  (req, next) => {

    const auth =
      inject(AuthService);

    const router =
      inject(Router);

    const accessToken =
      auth.getAccessToken();


    /*
     * На login/refresh access JWT
     * прикреплять не надо.
     */
    const isLoginRequest =
      req.url.includes(
        '/auth/login',
      );

    const isRefreshRequest =
      req.url.includes(
        '/auth/refresh',
      );


    /*
     * Cookie отправляем всегда.
     *
     * Это необходимо для refreshToken,
     * который лежит в HttpOnly cookie.
     */
    let request =
      req.clone({
        withCredentials: true,
      });


    /*
     * Для обычных API-запросов
     * добавляем accessToken.
     */
    if (
      accessToken &&
      !isLoginRequest &&
      !isRefreshRequest
    ) {
      request =
        request.clone({
          setHeaders: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        });
    }


    return next(request)
      .pipe(
        catchError(
          (
            error:
              HttpErrorResponse,
          ) => {

            /*
             * Не 401?
             *
             * Значит refresh вообще
             * не имеет отношения
             * к этой ошибке.
             */
            if (
              error.status !== 401
            ) {
              return throwError(
                () => error,
              );
            }


            /*
             * Login вернул 401:
             * неправильный логин/пароль.
             *
             * Refresh тут делать нельзя.
             */
            if (
              isLoginRequest
            ) {
              return throwError(
                () => error,
              );
            }


            /*
             * Сам refresh вернул 401.
             *
             * Значит refreshToken:
             * - истёк;
             * - отсутствует;
             * - инвалидирован.
             *
             * Сессия действительно закончилась.
             */
            if (
              isRefreshRequest
            ) {
              auth.clearSession();

              router.navigate([
                '/login',
              ]);

              return throwError(
                () => error,
              );
            }


            /*
             * Если refresh ещё никто
             * не запустил — запускаем.
             */
            if (
              !refreshRequest
            ) {
              refreshRequest =
                auth
                  .refresh()
                  .pipe(
                    catchError(
                      (
                        refreshError,
                      ) => {

                        auth.clearSession();

                        router.navigate([
                          '/login',
                        ]);

                        return throwError(
                          () =>
                            refreshError,
                        );
                      },
                    ),

                    finalize(() => {
                      refreshRequest =
                        null;
                    }),

                    shareReplay({
                      bufferSize: 1,
                      refCount: false,
                    }),
                  );
            }


            /*
             * Все запросы, которые одновременно
             * словили 401, ждут ОДИН
             * и тот же refresh.
             */
            return refreshRequest.pipe(
              switchMap(
                (
                  response:
                    RefreshResponse,
                ) => {

                  /*
                   * AuthService.refresh()
                   * уже сохранил новый token.
                   *
                   * Но для повторного запроса
                   * используем token сразу
                   * из response.
                   */
                  const retryRequest =
                    req.clone({
                      withCredentials:
                        true,

                      setHeaders: {
                        Authorization:
                          `Bearer ${response.accessToken}`,
                      },
                    });

                  return next(
                    retryRequest,
                  );
                },
              ),
            );
          },
        ),
      );
  };