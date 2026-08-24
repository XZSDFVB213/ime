import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',

  standalone: true,

  imports: [FormsModule],

  templateUrl: './login.html',

  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  email = '';
  password = '';

  readonly loading = signal(false);

  readonly showPassword = signal(false);

  readonly error = signal<string | null>(null);

  login(): void {
    const email = this.email.trim();

    if (!email || !this.password) {
      return;
    }

    this.auth
      .login({
        email,
        password: this.password,
      })
      .subscribe({
        next: (response) => {
          this.redirectByRole(response.user.roles);
        },

        error: (error) => {
          console.error('Ошибка входа:', error);
        },
      });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  private redirectByRole(roles: string[]): void {
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);

      return;
    }

    if (roles.includes('DEAN')) {
      this.router.navigate(['/dean']);

      return;
    }

    if (roles.includes('CURATOR')) {
      this.router.navigate(['/curator']);

      return;
    }

    if (roles.includes('TEACHER')) {
      this.router.navigate(['/teacher/dashboard']);

      return;
    }

    if (roles.includes('STUDENT')) {
      this.router.navigate(['/student/dashboard']);

      return;
    }

    this.error.set('Для пользователя не назначена роль');
  }
}
