import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private readonly http = inject(HttpClient);

  getMe() {
    return this.http.get<any>(`${environment.api}/auth/me`);
  }

  getSchedule() {
    return this.http.get<any[]>(`${environment.api}/lessons/student/my-schedule`);
  }

  getHomeworks() {
    return this.http.get<any[]>(`${environment.api}/homeworks/my-homeworks`);
  }

  getGrades() {
    return this.http.get<any[]>(`${environment.api}/homeworks/my-grades`);
  }
  getHomework(id: string) {
    return this.http.get<any>(`${environment.api}/homeworks/my-homeworks/${id}`);
  }

  submitHomework(homeworkId: string, content: string) {
    return this.http.post<any>(`${environment.api}/homeworks/${homeworkId}/pass`, {
      content,
    });
  }
  getMaterials() {
  return this.http.get<any[]>(
    `${environment.api}/materials/my-materials`,
  );
}
}
