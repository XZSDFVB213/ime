import { Routes } from '@angular/router';

import { TeacherLayout } from '../../core/layouts/teacher-layout/teacher-layout';

export const TeacherRoutes: Routes = [
  {
    path: '',
    component: TeacherLayout,

    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      {
        path: 'dashboard',
        data: {
          title: 'Главная',
        },
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },

      {
        path: 'homeworks/:id',
        data: {
          title: 'Проверка задания',
        },
        loadComponent: () =>
          import('./pages/homework-details/homework-details').then((m) => m.HomeworkDetails),
      },
      {
        path: 'homeworks',
        data: {
          title: 'Домашние задания',
        },
        loadComponent: () =>
          import('./pages/teacher-homeworks/teacher-homeworks').then((m) => m.TeacherHomeworks),
      },
      {
        path: 'schedule',
        data: {
          title: 'Расписание',
        },
        loadComponent: () =>
          import('./pages/teacher-schedule/teacher-schedule').then((m) => m.TeacherSchedule),
      },
      {
        path: 'homeworks/create/:lessonId',
        data: {
          title: 'Создание задания',
        },
        loadComponent: () =>
          import('./pages/teacher-create-homework/teacher-create-homework').then(
            (m) => m.TeacherCreateHomework,
          ),
      },
      {
        path: 'subjects',
        data: {
          title: 'Мои дисциплины',
        },
        loadComponent: () =>
          import('./pages/teacher-subjects/teacher-subjects').then((m) => m.TeacherSubjects),
      },
      {
        path: 'subjects/:id',
        data: {
          title: 'Дисциплина',
        },
        loadComponent: () =>
          import('./pages/teacher-subjects-details/teacher-subjects-details').then(
            (m) => m.TeacherSubjectDetails,
          ),
      },
      {
        path: 'students',
        data: {
          title: 'Мои студенты',
        },
        loadComponent: () =>
          import('./pages/teacher-students/teacher-students').then((m) => m.TeacherStudents),
      },
      {
        path: 'students/:id',
        data: {
          title: 'Карточка обучающегося',
        },
        loadComponent: () =>
          import('./pages/teacher-student-details/teacher-student-details').then(
            (m) => m.TeacherStudentDetails,
          ),
      },
      {
        path: 'materials',
        data: {
          title: 'Учебные материалы',
        },
        loadComponent: () => import('./pages/teacher-materials/teacher-materials').then((m) => m.TeacherMaterials),
      },
    ],
  },
  {
  path: 'messages',

  data: {
    title: 'Сообщения',
  },

  loadComponent: () =>
    import(
      '../messages/pages/messages/messages'
    ).then(
      (m) =>
        m.MessagesComponent,
    ),
},
];
