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

    loadComponent: () =>
      import('./core/layouts/student-layout/student-layout').then((m) => m.StudentLayout),

    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/student/student.routes').then((m) => m.StudentRoutes),
      },
    ],
  },
  {
  path: 'admin',

  loadChildren:
    () =>
      import(
        './features/admin/admin.routes'
      ).then(
        (m) =>
          m.AdminRoutes,
      ),
},
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
