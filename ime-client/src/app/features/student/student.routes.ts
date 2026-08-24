import { Routes } from '@angular/router';

export const StudentRoutes: Routes = [
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
      import('./pages/student-dashboard/student-dashboard').then((m) => m.StudentDashboard),
  },
  {
    path: 'homeworks',
    data: {
      title: 'Задания',
    },
    loadComponent: () =>
      import('./pages/student-homework/student-homework').then((m) => m.StudentHomeworks),
  },
  {
    path: 'homeworks/:id',
    data: {
      title: 'Задание',
    },
    loadComponent: () =>
      import('./pages/student-homework-details/student-homework-details').then(
        (m) => m.StudentHomeworkDetails,
      ),
  },
  {
    path: 'schedule',
    data: {
      title: 'Расписание',
    },
    loadComponent: () =>
      import('./pages/student-schedule/student-schedule').then((m) => m.StudentSchedule),
  },
  {
    path: 'subjects',
    data: {
      title: 'Дисциплины',
    },
    loadComponent: () =>
      import('./pages/student-subjects/student-subjects').then((m) => m.StudentSubjects),
  },
  {
    path: 'subjects/:id',
    data: {
      title: 'Дисциплина',
    },
    loadComponent: () =>
      import('./pages/student-subjects-details/student-subjects-details').then(
        (m) => m.StudentSubjectDetails,
      ),
  },
  {
    path: 'grades',
    data: {
      title: 'Оценки',
    },
    loadComponent: () =>
      import('./pages/student-grades/student-grades').then((m) => m.StudentGrades),
  },
  {
    path: 'profile',
    data: {
      title: 'Профиль',
    },
    loadComponent: () =>
      import('./pages/student-profile/student-profile').then((m) => m.StudentProfile),
  },
  {
  path: 'materials',
  data: {
    title: 'Учебные материалы',
  },
  loadComponent: () =>
    import('./pages/student-materials/student-materials')
      .then((m) => m.StudentMaterials),
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
