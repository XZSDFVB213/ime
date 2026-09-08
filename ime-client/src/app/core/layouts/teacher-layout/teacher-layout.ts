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
import { TeacherSessionService } from '../../../features/teacher/services/teacher-session.service';
import { NotificationBellComponent } from "../../../shared/components/notification-bell/notification-bell";

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, NotificationBellComponent],
  templateUrl: './teacher-layout.html',
  styleUrl: './teacher-layout.scss',
})
export class TeacherLayout {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly session = inject(TeacherSessionService);

  readonly sidebarOpened = signal(false);
  readonly pageTitle = signal('Главная');

  readonly menu: MenuItem[] = [
    {
      label: 'Главная',
      icon: 'home',
      path: '/teacher/dashboard',
    },
    {
      label: 'Мои дисциплины',
      icon: 'menu_book',
      path: '/teacher/subjects',
    },
    {
      label: 'Расписание',
      icon: 'calendar_month',
      path: '/teacher/schedule',
    },
    {
      label: 'Мои задания',
      icon: 'assignment',
      path: '/teacher/homeworks',
    },
    {
      label: 'Работы студентов',
      icon: 'grading',
      path: '/teacher/submissions',
    },
    {
      label: 'Лекции',
      icon: 'description',
      path: '/teacher/lectures',
    },
    {
      label: 'Обучающиеся',
      icon: 'groups',
      path: '/teacher/students',
    },
    {
      label: 'Материалы',
      icon: 'folder_open',
      path: '/teacher/materials',
    },
    {
      label: 'Сообщения',
      icon: 'forum',
      path: '/teacher/messages',
    },
    
    {
      label: 'Профиль',
      icon: 'person_outline',
      path: '/teacher/profile',
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
