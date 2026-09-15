import { computed, inject, Injectable, signal } from '@angular/core';

import { finalize } from 'rxjs';

import { TeacherService } from './teacher.service';
interface Department {
  id: string;
  name: string;
}

interface TeacherDepartment {
  department: Department;
}
@Injectable({
  providedIn: 'root',
})
export class TeacherSessionService {
  private readonly teacherService = inject(TeacherService);

  readonly user = signal<any | null>(null);
  readonly loading = signal(false);
  readonly loaded = signal(false);

  readonly fullName = computed(() => {
    return this.user()?.fullName ?? 'Преподаватель';
  });

  readonly firstName = computed(() => {
    return this.fullName().trim().split(/\s+/)[0] || 'Преподаватель';
  });
  readonly departments = computed<Department[]>(() => {
    return (
      this.user()?.teacher?.departments?.map((item: TeacherDepartment) => item.department) ?? []
    );
  });
  readonly email = computed(() => {
    return this.user()?.email ?? '';
  });

  readonly position = computed(() => {
    return this.user()?.teacher?.position ?? 'Преподаватель';
  });

  readonly departmentNames = computed(() => {
    const departments = this.departments();

    if (!departments.length) {
      return 'Кафедра не указана';
    }

    return departments.map((department) => department.name).join(', ');
  });

  readonly initials = computed(() => {
    return this.fullName()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string[]) => part[0]?.toUpperCase())
      .join('');
  });

  load(force = false): void {
    if (this.loading() || (this.loaded() && !force)) {
      return;
    }

    this.loading.set(true);

    this.teacherService
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
          console.error('Не удалось загрузить преподавателя', error);

          this.user.set(null);
        },
      });
  }

  clear(): void {
    this.user.set(null);
    this.loaded.set(false);
  }
}
