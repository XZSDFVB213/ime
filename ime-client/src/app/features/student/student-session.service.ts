import { computed, inject, Injectable, signal } from '@angular/core';

import { finalize } from 'rxjs';

import { StudentService } from './student.service';

@Injectable({
  providedIn: 'root',
})
export class StudentSessionService {
  private readonly studentService = inject(StudentService);

  readonly user = signal<any | null>(null);
  readonly loading = signal(false);
  readonly loaded = signal(false);

  readonly fullName = computed(() => {
    return this.user()?.fullName ?? 'Обучающийся';
  });

  readonly firstName = computed(() => {
    const fullName = this.fullName().trim();

    return fullName.split(' ')[0] || 'Обучающийся';
  });

  readonly groupName = computed(() => {
    return this.user()?.student?.group?.name ?? 'Группа не указана';
  });

  readonly departmentName = computed(() => {
    return this.user()?.student?.group?.department?.name ?? 'Обучающийся';
  });

  readonly email = computed(() => {
    return this.user()?.email ?? '';
  });

  readonly initials = computed(() => {
    const parts = this.fullName().trim().split(/\s+/).filter(Boolean);

    return parts
      .slice(0, 2)
      .map((part: string[]) => part[0]?.toUpperCase())
      .join('');
  });

  load(force = false): void {
    if (this.loading() || (this.loaded() && !force)) {
      return;
    }

    this.loading.set(true);

    this.studentService
      .getMe()
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.loaded.set(true);
        }),
      )
      .subscribe({
        next: (user) => {
          this.user.set(user);
        },

        error: (error) => {
          console.error('Не удалось загрузить профиль', error);

          this.user.set(null);
        },
      });
  }

  clear(): void {
    this.user.set(null);
    this.loaded.set(false);
  }
}
