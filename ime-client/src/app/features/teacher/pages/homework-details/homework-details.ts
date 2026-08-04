import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TeacherService } from '../../services/teacher.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import {
  GradeDialog,
  GradeDialogData,
  GradeDialogResult,
} from '../../../../shared/ui/dialog/grade-dialog/grade-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CreateHomeworkDialog,
  CreateHomeworkDialogData,
  CreateHomeworkResult,
} from '../../../../shared/ui/dialog/create-homework-dialog/create-homework-dialog';

@Component({
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatListModule,
    MatBadgeModule,
  ],
  templateUrl: './homework-details.html',
  styleUrl: './homework-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeworkDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(TeacherService);

  // Если API возвращает массив — оставляем any[]
  // Если один объект — поменяй на signal<any | null>(null) и поправь шаблон
  readonly homeworks = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.service.getHomework(id).subscribe({
      next: (res) => {
        // Нормализуем: если пришёл один объект — делаем массив
        const list = Array.isArray(res) ? res : [res];
        this.homeworks.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Не удалось загрузить домашние задания');
        this.loading.set(false);
      },
    });
  }

  private readonly dialog = inject(MatDialog);

  private readonly snackBar = inject(MatSnackBar);

  // ========== ОЦЕНКА / ИЗМЕНЕНИЕ ОЦЕНКИ ==========
  grade(submission: any, homework: any): void {
    const data: GradeDialogData = {
      submissionId: submission.id,
      studentName: submission.student?.user?.fullName ?? 'Студент',
      studentEmail: submission.student?.user?.email ?? '',
      maxScore: homework.maxScore,
      currentScore: submission.score,
      currentComment: submission.comment ?? null,
    };

    const dialogRef = this.dialog.open(GradeDialog, {
      width: '440px',
      maxWidth: '95vw',
      data,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: GradeDialogResult | undefined) => {
      if (!result) return;

      this.service.gradeSubmission(submission.id, result.score, result.comment).subscribe({
        next: () => {
          // Иммутабельное обновление сигнала
          this.homeworks.update((list) =>
            list.map((hw) => {
              if (hw.id !== homework.id) return hw;

              return {
                ...hw,
                submissions: hw.submissions.map((s: any) =>
                  s.id === submission.id
                    ? { ...s, score: result.score, comment: result.comment }
                    : s,
                ),
              };
            }),
          );

          this.snackBar.open('Оценка сохранена', 'OK', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Ошибка при сохранении оценки', 'Закрыть', { duration: 4000 });
        },
      });
    });
  }
}
