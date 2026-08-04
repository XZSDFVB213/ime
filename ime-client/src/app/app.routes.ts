import { Routes } from '@angular/router';
import { StudentLayout } from './core/layouts/student-layout/student-layout';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./core/layouts/auth-layout/auth-layout').then((c) => c.AuthLayout),

    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth.routes').then((r) => r.AUTH_ROUTES),
      },
    ],
  },
  {
    path: 'teacher',
    loadChildren: () => import('./features/teacher/teacher.routes').then((m) => m.TeacherRoutes),
  },
  {
    path: 'student',
    component: StudentLayout,

    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((r) => r.DASHBOARD_ROUTES),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'auth',
  },
];
