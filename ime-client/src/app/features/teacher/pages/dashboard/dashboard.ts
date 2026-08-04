import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TeacherService } from '../../services/teacher.service';
import { RouterLink } from '@angular/router';
import {
  CreateHomeworkDialog,
  CreateHomeworkDialogData,
  CreateHomeworkResult,
} from '../../../../shared/ui/dialog/create-homework-dialog/create-homework-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly service = inject(TeacherService);

  // Signals
  readonly teacher = signal<any>(null);
  readonly lessons = signal<any[]>([]);
  readonly homeworks = signal<any[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  // ========== СОЗДАНИЕ ДЗ ==========
  createHomework(): void {
    const lessons = this.lessons();

    if (!lessons.length) {
      this.snackBar.open('Сначала должны быть занятия', 'OK', { duration: 3000 });
      return;
    }

    // Пока берём первое занятие.
    // Позже можно добавить выбор занятия в диалоге.
    const lesson = lessons[0];

    const dialogRef = this.dialog.open(CreateHomeworkDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        lessonId: lesson.id,
        subjectId: lesson.subjectId,
        teacherId: lesson.teacherId,
      } satisfies CreateHomeworkDialogData,
    });

    dialogRef.afterClosed().subscribe((result: CreateHomeworkResult | undefined) => {
      if (!result) return;

      this.service.createHomework(result).subscribe({
        next: (created) => {
          this.homeworks.update((list) => [created, ...list]);
          this.snackBar.open('Домашнее задание создано', 'OK', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Не удалось создать задание', 'Закрыть', { duration: 4000 });
        },
      });
    });
  }
  private loadData(): void {
    this.loading.set(true);

    this.service.getMe().subscribe({
      next: (res) => this.teacher.set(res),
      error: () => this.teacher.set(null),
    });

    this.service.getLessons().subscribe({
      next: (res) => this.lessons.set(res ?? []),
      error: () => this.lessons.set([]),
    });

    this.service.getHomeworks().subscribe({
      next: (res) => {
        this.homeworks.set(res ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.homeworks.set([]);
        this.loading.set(false);
      },
    });
  }
}
