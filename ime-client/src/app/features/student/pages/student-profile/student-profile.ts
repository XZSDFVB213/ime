import { Component, computed, inject } from '@angular/core';

import { Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { StudentSessionService } from '../../student-session.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.scss',
})
export class StudentProfile {
  readonly session = inject(StudentSessionService);

  private readonly router = inject(Router);

  readonly user = computed(() => {
    return this.session.user();
  });

  readonly group = computed(() => {
    return this.user()?.student?.group ?? null;
  });

  readonly department = computed(() => {
    return this.group()?.department ?? null;
  });

  readonly roleName = computed(() => {
    const roles = this.user()?.roles ?? [];

    return roles.includes('STUDENT') ? 'Обучающийся' : 'Пользователь';
  });

  refresh(): void {
    this.session.load(true);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    this.session.clear();

    this.router.navigate(['/auth/login']);
  }
}
