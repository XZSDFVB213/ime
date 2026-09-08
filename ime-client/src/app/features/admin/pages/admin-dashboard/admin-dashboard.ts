import { Component, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';

import { AdminService } from '../../services/admin.service';

interface DashboardUser {
  id: string;

  fullName: string;
  email: string;

  status: string;

  createdAt: string;

  student?: {
    id: string;

    group?: {
      id: string;
      name: string;
    } | null;
  } | null;

  teacher?: {
    id: string;

    position?: string | null;

    department?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface DashboardGroup {
  id: string;
  name: string;

  department?: {
    id: string;
    name: string;
  } | null;

  students?: any[];

  _count?: {
    students: number;
  };
}

interface DashboardDepartment {
  id: string;
  name: string;
}

interface DashboardDiscipline {
  id: string;
  name: string;
  code?: string | null;
}

@Component({
  selector: 'app-admin-dashboard',

  standalone: true,

  imports: [CommonModule, RouterLink, MatIconModule, MatSnackBarModule],

  templateUrl: './admin-dashboard.html',

  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  private readonly adminService = inject(AdminService);

  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);

  readonly students = signal<DashboardUser[]>([]);

  readonly teachers = signal<DashboardUser[]>([]);

  readonly groups = signal<DashboardGroup[]>([]);

  readonly departments = signal<DashboardDepartment[]>([]);

  readonly disciplines = signal<DashboardDiscipline[]>([]);

  readonly activeStudents = computed(
    () => this.students().filter((student) => student.status === 'ACTIVE').length,
  );

  readonly activeTeachers = computed(
    () => this.teachers().filter((teacher) => teacher.status === 'ACTIVE').length,
  );

  readonly studentsWithoutGroup = computed(
    () => this.students().filter((student) => !student.student?.group).length,
  );

  readonly teachersWithoutDepartment = computed(
    () => this.teachers().filter((teacher) => !teacher.teacher?.department).length,
  );

  readonly totalUsers = computed(() => this.students().length + this.teachers().length);

  readonly recentUsers = computed(() => {
    const students = this.students().map((student) => ({
      ...student,
      userType: 'STUDENT' as const,
    }));

    const teachers = this.teachers().map((teacher) => ({
      ...teacher,
      userType: 'TEACHER' as const,
    }));

    return [...students, ...teachers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  });

  readonly sortedGroups = computed(() => {
    return [...this.groups()]
      .sort((a, b) => this.groupStudentsCount(b) - this.groupStudentsCount(a))
      .slice(0, 6);
  });

  readonly maxGroupSize = computed(() => {
    const max = Math.max(...this.groups().map((group) => this.groupStudentsCount(group)), 1);

    return max;
  });

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);

    forkJoin({
      students: this.adminService.getStudents(),

      teachers: this.adminService.getTeachers(),

      groups: this.adminService.getGroups(),

      departments: this.adminService.getDepartments(),

      disciplines: this.adminService.getDisciplines(),
    }).subscribe({
      next: ({ students, teachers, groups, departments, disciplines }) => {
        this.students.set(students as DashboardUser[]);

        this.teachers.set(teachers as DashboardUser[]);

        this.groups.set(groups as DashboardGroup[]);

        this.departments.set(departments as DashboardDepartment[]);

        this.disciplines.set(disciplines as DashboardDiscipline[]);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка загрузки dashboard:', error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить данные панели администратора', 'Закрыть', {
          duration: 3500,
        });
      },
    });
  }

  groupStudentsCount(group: DashboardGroup): number {
    return group._count?.students ?? group.students?.length ?? 0;
  }

  groupProgress(group: DashboardGroup): number {
    return (this.groupStudentsCount(group) / this.maxGroupSize()) * 100;
  }

  initials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('');
  }

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  userDescription(user: ReturnType<typeof this.recentUsers>[number]): string {
    if (user.userType === 'STUDENT') {
      return user.student?.group?.name ?? 'Без группы';
    }

    return user.teacher?.position ?? 'Преподаватель';
  }
}
