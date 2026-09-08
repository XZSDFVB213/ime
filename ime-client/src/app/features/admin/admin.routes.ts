import {
  Routes,
} from '@angular/router';

import {
  AdminLayout,
} from '../../core/layouts/admin-layout/admin-layout';

export const AdminRoutes: Routes = [
  {
    path: '',

    component:
      AdminLayout,

    children: [
      {
        path: '',

        redirectTo:
          'dashboard',

        pathMatch:
          'full',
      },

      {
        path:
          'dashboard',

        loadComponent:
          () =>
            import(
              './pages/admin-dashboard/admin-dashboard'
            ).then(
              (m) =>
                m.AdminDashboard,
            ),
      },

      {
        path:
          'students',

        loadComponent:
          () =>
            import(
              './pages/admin-students/admin-students'
            ).then(
              (m) =>
                m.AdminStudents,
            ),
      },
  {
        path:
          'groups',

        loadComponent:
          () =>
            import(
              './pages/admin-groups/admin-groups'
            ).then(
              (m) =>
                m.AdminGroups,
            ),
      },
      {
        path:
          'teachers',

        loadComponent:
          () =>
            import(
              './pages/admin-teachers/admin-teachers'
            ).then(
              (m) =>
                m.AdminTeachers,
            ),
      },

      {
        path:
          'groups',

        loadComponent:
          () =>
            import(
              './pages/admin-groups/admin-groups'
            ).then(
              (m) =>
                m.AdminGroups,
            ),
      },

      {
        path:
          'subjects',

        loadComponent:
          () =>
            import(
              './pages/admin-subjects/admin-subjects'
            ).then(
              (m) =>
                m.AdminSubjects,
            ),
      },

      {
        path:
          'materials',

        loadComponent:
          () =>
            import(
              './pages/admin-materials/admin-materials'
            ).then(
              (m) =>
                m.AdminMaterials,
            ),
      },

      {
        path:
          'users',

        loadComponent:
          () =>
            import(
              './pages/admin-users/admin-users'
            ).then(
              (m) =>
                m.AdminUsers,
            ),
      },
    ],
  },
];