import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';

import {
  MatSelectModule,
} from '@angular/material/select';

import {
  AdminService,
} from '../../services/admin.service';

import {
  CreateMaterialDialogComponent,
} from './create-material-dialog/create-material-dialog';


interface Subject {
  id: string;
  name: string;
}


interface Material {
  id: string;

  title: string;
  description?: string | null;

  type:
    | 'FILE'
    | 'LINK';

  url: string;

  fileName?: string | null;
  mimeType?: string | null;
  size?: number | null;

  createdAt: string;

  subject: Subject;

  teacher?: {
    user: {
      fullName: string;
    };
  } | null;

  uploadedByUser?: {
    id: string;
    fullName: string;
  } | null;
}


@Component({
  selector:
    'app-admin-materials',

  standalone: true,

  imports: [
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
  ],

  templateUrl:
    './admin-materials.html',

  styleUrl:
    './admin-materials.scss',
})
export class AdminMaterials {
  private readonly adminService =
    inject(AdminService);

  private readonly dialog =
    inject(MatDialog);

  private readonly snackBar =
    inject(MatSnackBar);


  readonly materials =
    signal<Material[]>([]);

  readonly subjects =
    signal<Subject[]>([]);

  readonly loading =
    signal(true);

  readonly search =
    signal('');

  readonly typeFilter =
    signal('ALL');

  readonly subjectFilter =
    signal('ALL');


  readonly filteredMaterials =
    computed(() => {
      const search =
        this.search()
          .trim()
          .toLowerCase();

      const type =
        this.typeFilter();

      const subject =
        this.subjectFilter();

      return this.materials()
        .filter(
          (material) => {
            if (
              type !== 'ALL' &&
              material.type !== type
            ) {
              return false;
            }

            if (
              subject !== 'ALL' &&
              material.subject.id !==
                subject
            ) {
              return false;
            }

            if (!search) {
              return true;
            }

            return (
              material.title
                .toLowerCase()
                .includes(search) ||

              material.subject.name
                .toLowerCase()
                .includes(search) ||

              material.description
                ?.toLowerCase()
                .includes(search)
            );
          },
        );
    });


  readonly filesCount =
    computed(
      () =>
        this.materials().filter(
          (item) =>
            item.type === 'FILE',
        ).length,
    );


  readonly linksCount =
    computed(
      () =>
        this.materials().filter(
          (item) =>
            item.type === 'LINK',
        ).length,
    );


  constructor() {
    this.load();
  }


  load(): void {
    this.loading.set(true);

    this.adminService
      .getMaterialSubjects()
      .subscribe({
        next: (subjects) => {
          this.subjects.set(
            subjects,
          );
        },
      });

    this.adminService
      .getMaterials()
      .subscribe({
        next: (materials) => {
          this.materials.set(
            materials as Material[],
          );

          this.loading.set(false);
        },

        error: () => {
          this.loading.set(false);

          this.snackBar.open(
            'Не удалось загрузить материалы',
            'Закрыть',
            {
              duration: 3000,
            },
          );
        },
      });
  }


  openCreate(): void {
    const ref =
      this.dialog.open(
        CreateMaterialDialogComponent,
        {
          width: '600px',

          maxWidth:
            'calc(100vw - 32px)',

          autoFocus: false,

          data: {
            subjects:
              this.subjects(),
          },
        },
      );

    ref.afterClosed()
      .subscribe(
        (created) => {
          if (created) {
            this.load();
          }
        },
      );
  }


  deleteMaterial(
    material: Material,
  ): void {
    const confirmed =
      confirm(
        `Удалить материал «${material.title}»?`,
      );

    if (!confirmed) {
      return;
    }

    this.adminService
      .deleteMaterial(
        material.id,
      )
      .subscribe({
        next: () => {
          this.materials.update(
            (items) =>
              items.filter(
                (item) =>
                  item.id !==
                  material.id,
              ),
          );
        },

        error: () => {
          this.snackBar.open(
            'Не удалось удалить материал',
            'Закрыть',
            {
              duration: 3000,
            },
          );
        },
      });
  }


  formatSize(
    size?: number | null,
  ): string {
    if (!size) {
      return '';
    }

    if (size < 1024 * 1024) {
      return `${Math.round(
        size / 1024,
      )} КБ`;
    }

    return `${(
      size /
      1024 /
      1024
    ).toFixed(1)} МБ`;
  }
}