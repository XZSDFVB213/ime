import { Routes } from '@angular/router';
import { TeacherLayout } from '../../core/layouts/teacher-layout/teacher-layout';

export const TeacherRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../core/layouts/teacher-layout/teacher-layout').then((m) => m.TeacherLayout),

    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },

      {
        path: 'homeworks/:id',
        loadComponent: () =>
          import('./pages/homework-details/homework-details').then(
            (m) => m.HomeworkDetails,
          ),
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
