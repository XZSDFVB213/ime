import { Component, Inject, computed, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatIconModule } from '@angular/material/icon';

import { MatSelectModule } from '@angular/material/select';

import { MatTabsModule } from '@angular/material/tabs';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { finalize, forkJoin } from 'rxjs';

import { AdminService } from '../../../services/admin.service';

import { AdminGroup } from '../admin-groups';

interface AdminStudent {
  id: string;

  fullName: string;
  email: string;

  status: string;

  student: {
    id: string;

    group?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface AdminTeacher {
  id: string;

  fullName: string;
  email: string;

  teacher: {
    id: string;

    position?: string | null;

    department?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface Discipline {
  id: string;
  name: string;
  description?: string | null;
}

interface GroupAssignment {
  id: string;

  teacherId: string;
  disciplineId: string;
  groupId: string;

  discipline: {
    id: string;
    name: string;
    description?: string | null;
  };

  teacher: {
    id: string;

    position?: string | null;

    user: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl?: string | null;
    };

    department?: {
      id: string;
      name: string;
    } | null;
  };
}

@Component({
  selector: 'app-group-details-dialog',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,

    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
  ],

  templateUrl: './group-details-dialog.html',

  styleUrl: './group-details-dialog.scss',
})
export class GroupDetailsDialogComponent {
  private readonly adminService = inject(AdminService);

  private readonly dialogRef = inject(MatDialogRef<GroupDetailsDialogComponent>);

  private readonly snackBar = inject(MatSnackBar);

  readonly allStudents = signal<AdminStudent[]>([]);

  readonly teachers = signal<AdminTeacher[]>([]);

  readonly disciplines = signal<Discipline[]>([]);

  readonly assignments = signal<GroupAssignment[]>([]);

  readonly loading = signal(true);

  readonly assigningStudent = signal(false);

  readonly assigningTeacher = signal(false);

  readonly deletingAssignmentId = signal<string | null>(null);

  readonly search = signal('');

  studentId = '';

  teacherId = '';

  disciplineId = '';
  readonly disciplinesCount = computed(() => {
    return new Set(this.assignments().map((assignment) => assignment.disciplineId)).size;
  });
  readonly groupStudents = computed(() => {
    return this.allStudents().filter(
      (student) => student.student?.group?.id === this.data.group.id,
    );
  });

  readonly filteredGroupStudents = computed(() => {
    const search = this.search().trim().toLowerCase();

    if (!search) {
      return this.groupStudents();
    }

    return this.groupStudents().filter(
      (student) =>
        student.fullName.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search),
    );
  });

  readonly availableStudents = computed(() => {
    return this.allStudents().filter(
      (student) => !!student.student && student.student.group?.id !== this.data.group.id,
    );
  });

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      group: AdminGroup;
    },
  ) {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    forkJoin({
      students: this.adminService.getStudents(),

      teachers: this.adminService.getTeachers(),

      disciplines: this.adminService.getDisciplines(),

      assignments: this.adminService.getGroupAssignments(this.data.group.id),
    }).subscribe({
      next: ({ students, teachers, disciplines, assignments }) => {
        this.allStudents.set(students as AdminStudent[]);

        this.teachers.set(teachers as AdminTeacher[]);

        this.disciplines.set(disciplines as Discipline[]);

        this.assignments.set(assignments as GroupAssignment[]);

        this.loading.set(false);
      },

      error: (error) => {
        console.error('Ошибка загрузки группы:', error);

        this.loading.set(false);

        this.snackBar.open('Не удалось загрузить данные группы', 'Закрыть', {
          duration: 3500,
        });
      },
    });
  }

  assignStudent(): void {
    if (!this.studentId || this.assigningStudent()) {
      return;
    }

    const student = this.allStudents().find((item) => item.id === this.studentId);

    if (!student?.student) {
      return;
    }

    this.assigningStudent.set(true);

    this.adminService
      .assignStudentToGroup(student.student.id, this.data.group.id)
      .pipe(
        finalize(() => {
          this.assigningStudent.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.studentId = '';

          this.snackBar.open('Студент добавлен в группу', 'OK', {
            duration: 2200,
          });

          this.reloadStudents();
        },

        error: (error) => {
          this.snackBar.open(error.error?.message ?? 'Не удалось перевести студента', 'Закрыть', {
            duration: 3500,
          });
        },
      });
  }

  reloadStudents(): void {
    this.adminService.getStudents().subscribe({
      next: (students) => {
        this.allStudents.set(students as AdminStudent[]);
      },
    });
  }

  assignTeacher(): void {
    if (!this.teacherId || !this.disciplineId || this.assigningTeacher()) {
      return;
    }

    const exists = this.assignments().some(
      (assignment) =>
        assignment.teacherId === this.teacherId && assignment.disciplineId === this.disciplineId,
    );

    if (exists) {
      this.snackBar.open('Такое назначение уже существует', 'OK', {
        duration: 2500,
      });

      return;
    }

    this.assigningTeacher.set(true);

    this.adminService
      .assignTeacher(this.teacherId, {
        disciplineId: this.disciplineId,

        groupId: this.data.group.id,
      })
      .pipe(
        finalize(() => {
          this.assigningTeacher.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.teacherId = '';
          this.disciplineId = '';

          this.snackBar.open('Преподаватель назначен', 'OK', {
            duration: 2200,
          });

          this.reloadAssignments();
        },

        error: (error) => {
          console.error(error);

          this.snackBar.open(error.error?.message ?? 'Не удалось выполнить назначение', 'Закрыть', {
            duration: 3500,
          });
        },
      });
  }

  reloadAssignments(): void {
    this.adminService.getGroupAssignments(this.data.group.id).subscribe({
      next: (assignments) => {
        this.assignments.set(assignments as GroupAssignment[]);
      },
    });
  }

  removeAssignment(assignment: GroupAssignment): void {
    if (this.deletingAssignmentId()) {
      return;
    }

    this.deletingAssignmentId.set(assignment.id);

    this.adminService
      .deleteTeacherAssignment(assignment.teacherId, assignment.id)
      .pipe(
        finalize(() => {
          this.deletingAssignmentId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.assignments.update((assignments) =>
            assignments.filter((item) => item.id !== assignment.id),
          );

          this.snackBar.open('Назначение удалено', 'OK', {
            duration: 2000,
          });
        },

        error: (error) => {
          console.error(error);

          this.snackBar.open('Не удалось удалить назначение', 'Закрыть', {
            duration: 3000,
          });
        },
      });
  }

  close(): void {
    this.dialogRef.close(true);
  }

  initials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}
