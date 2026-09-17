import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';

import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';

import {
  AdminAcademicYear,
  AdminService,
} from '../../services/admin.service';
import { CreateAcademicYearDialog } from '../create-academic-year-dialog/create-academic-year-dialog';



@Component({
  selector:
    'app-academic-years',

  standalone: true,

  imports: [
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],

  templateUrl:
    './academic-years.html',

  styleUrl:
    './academic-years.scss',
})
export class AcademicYears {
  private readonly adminService =
    inject(AdminService);

  private readonly dialog =
    inject(MatDialog);

  private readonly snackBar =
    inject(MatSnackBar);


  readonly academicYears =
    signal<AdminAcademicYear[]>([]);

  readonly loading =
    signal(true);

  readonly error =
    signal<string | null>(null);


  constructor() {
    this.load();
  }


  openCreate(): void {
    const dialogRef =
      this.dialog.open(
        CreateAcademicYearDialog,
        {
          width: '460px',
          maxWidth:
            'calc(100vw - 24px)',
          autoFocus: false,
        },
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (created) => {
          if (!created) {
            return;
          }

          this.snackBar.open(
            'Учебный год создан',
            'Закрыть',
            {
              duration: 2500,
            },
          );

          this.load();
        },
      );
  }


  private load(): void {
    this.loading.set(true);
    this.error.set(null);


    this.adminService
      .getAcademicYears()
      .subscribe({
        next: (years) => {
          this.academicYears.set(
            years,
          );

          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            'Ошибка загрузки учебных годов',
            error,
          );

          this.error.set(
            error.error?.message ??
              'Не удалось загрузить учебные годы',
          );

          this.loading.set(false);
        },
      });
  }
}