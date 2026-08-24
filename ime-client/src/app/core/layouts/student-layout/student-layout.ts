import { Component, DestroyRef, inject, signal } from '@angular/core';

import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { filter, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatIconModule } from '@angular/material/icon';

import { StudentSessionService } from '../../../features/student/student-session.service';
import { NotificationBellComponent } from "../../../shared/components/notification-bell/notification-bell";

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, NotificationBellComponent],
  templateUrl: './student-layout.html',
  styleUrl: './student-layout.scss',
})
export class StudentLayout {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly session = inject(StudentSessionService);

  readonly sidebarOpened = signal(false);
  readonly pageTitle = signal('Главная');

  readonly menu: MenuItem[] = [
    {
      label: 'Главная',
      icon: 'home',
      path: '/student/dashboard',
    },
    {
      label: 'Мои дисциплины',
      icon: 'menu_book',
      path: '/student/subjects',
    },
    {
      label: 'Расписание',
      icon: 'calendar_month',
      path: '/student/schedule',
    },
    {
      label: 'Оценки',
      icon: 'grade',
      path: '/student/grades',
    },
    {
      label: 'Домашние задания',
      icon: 'assignment',
      path: '/student/homeworks',
    },
    {
      label: 'Уведомления',
      icon: 'notifications_none',
      path: '/student/notifications',
      badge: 3,
    },
    {
      label: 'Сообщения',
      icon: 'forum',
      path: '/student/messages',
    },
    {
      label: 'Материалы',
      icon: 'folder_open',
      path: '/student/materials',
    },
    {
      label: 'Библиотека',
      icon: 'local_library',
      path: '/student/library',
    },
    {
      label: 'Портфолио',
      icon: 'work_outline',
      path: '/student/portfolio',
    },
    {
      label: 'Профиль',
      icon: 'person_outline',
      path: '/student/profile',
    },
  ];

  constructor() {
    this.session.load();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        let route = this.activatedRoute;

        while (route.firstChild) {
          route = route.firstChild;
        }

        this.pageTitle.set(route.snapshot.data['title'] ?? 'Главная');
      });
  }

  toggleSidebar(): void {
    this.sidebarOpened.update((value) => !value);
  }

  closeSidebar(): void {
    this.sidebarOpened.set(false);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    this.session.clear();

    this.router.navigate(['/auth/login']);
  }
}
