import {
  Component,
  Inject,
  inject,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatSelectModule,
} from '@angular/material/select';

import {
  finalize,
} from 'rxjs';

import {
  PortfolioItemType,
  PortfolioService,
  PortfolioSubject,
} from '../../../portfolio.service';


type SourceType =
  | 'FILE'
  | 'LINK';


@Component({
  selector:
    'app-add-portfolio-dialog',

  standalone: true,

  imports: [
    FormsModule,
    MatIconModule,
    MatSelectModule,
  ],

  templateUrl:
    './add-portfolio-dialog.html',

  styleUrl:
    './add-portfolio-dialog.scss',
})
export class AddPortfolioDialog {
  private readonly portfolioService =
    inject(PortfolioService);

  private readonly dialogRef =
    inject(
      MatDialogRef<AddPortfolioDialog>,
    );


  readonly types: {
    value: PortfolioItemType;
    label: string;
    icon: string;
  }[] = [
    {
      value: 'PROJECT',
      label: 'Проект',
      icon: 'code',
    },
    {
      value: 'COURSEWORK',
      label: 'Курсовая работа',
      icon: 'description',
    },
    {
      value: 'RESEARCH',
      label: 'Исследовательская работа',
      icon: 'science',
    },
    {
      value: 'PRESENTATION',
      label: 'Презентация',
      icon: 'slideshow',
    },
    {
      value: 'CERTIFICATE',
      label: 'Сертификат',
      icon: 'workspace_premium',
    },
    {
      value: 'DIPLOMA',
      label: 'Диплом / грамота',
      icon: 'military_tech',
    },
    {
      value: 'OTHER',
      label: 'Другое',
      icon: 'folder_open',
    },
  ];


  title = '';

  description = '';

  type:
    PortfolioItemType =
      'PROJECT';

  subjectId = '';

  sourceType:
    SourceType =
      'FILE';

  url = '';

  file:
    File | null =
      null;


  readonly saving =
    signal(false);

  readonly error =
    signal<string | null>(null);


  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      subjects: PortfolioSubject[];
    },
  ) {}


  setSource(
    type: SourceType,
  ): void {
    this.sourceType =
      type;

    this.error.set(null);
  }


  onFileSelected(
    event: Event,
  ): void {
    const input =
      event.target as
        HTMLInputElement;


    this.file =
      input.files?.[0] ??
      null;


    this.error.set(null);
  }


  removeFile(): void {
    this.file =
      null;
  }


  save(): void {
    this.error.set(null);


    if (!this.title.trim()) {
      this.error.set(
        'Укажите название работы',
      );

      return;
    }


    if (
      this.sourceType ===
        'FILE' &&
      !this.file
    ) {
      this.error.set(
        'Выберите файл',
      );

      return;
    }


    if (
      this.sourceType ===
        'LINK' &&
      !this.url.trim()
    ) {
      this.error.set(
        'Укажите ссылку на работу',
      );

      return;
    }


    if (
      this.sourceType ===
      'LINK'
    ) {
      try {
        const url =
          new URL(
            this.url.trim(),
          );

        if (
          url.protocol !==
            'http:' &&
          url.protocol !==
            'https:'
        ) {
          throw new Error();
        }
      } catch {
        this.error.set(
          'Укажите корректную ссылку',
        );

        return;
      }
    }


    this.saving.set(true);


    const request =
      this.sourceType === 'FILE'
        ? this.portfolioService
            .createFile(
              {
                title:
                  this.title.trim(),

                description:
                  this.description
                    .trim() ||
                  undefined,

                type:
                  this.type,

                subjectId:
                  this.subjectId ||
                  undefined,
              },

              this.file!,
            )
        : this.portfolioService
            .createLink({
              title:
                this.title.trim(),

              description:
                this.description
                  .trim() ||
                undefined,

              type:
                this.type,

              subjectId:
                this.subjectId ||
                undefined,

              url:
                this.url.trim(),
            });


    request
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: (item) => {
          this.dialogRef.close(
            item,
          );
        },

        error: (error) => {
          console.error(
            'Ошибка добавления в портфолио:',
            error,
          );

          this.error.set(
            error.error?.message ??
              'Не удалось добавить работу',
          );
        },
      });
  }


  formatFileSize(
    bytes: number,
  ): string {
    if (bytes < 1024) {
      return `${bytes} Б`;
    }


    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} КБ`;
    }


    return `${(
      bytes /
      1024 /
      1024
    ).toFixed(1)} МБ`;
  }


  close(): void {
    this.dialogRef.close();
  }
}