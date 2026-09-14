import {
  Component,
  computed,
  inject,
} from '@angular/core';

import {
  MatIconModule,
} from '@angular/material/icon';
import { TeacherSessionService } from '../../services/teacher-session.service';




@Component({
  selector: 'app-teacher-profile',

  standalone: true,

  imports: [
    MatIconModule,
  ],

  templateUrl: './teacher-profile.html',

  styleUrl: './teacher-profile.scss',
})
export class TeacherProfile {
  readonly session =
    inject(TeacherSessionService);


  readonly phone =
    computed(
      () =>
        this.session.user()?.phone ??
        'Не указан',
    );


  readonly status =
    computed(
      () =>
        this.session.user()?.status ??
        'ACTIVE',
    );


  constructor() {
    this.session.load();
  }
}