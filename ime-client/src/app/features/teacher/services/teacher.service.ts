import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private http = inject(HttpClient);

  private api = 'http://localhost:3000';

  getMe() {
    return this.http.get<any>(`${environment.api}/auth/me`);
  }

  getLessons() {
    return this.http.get<any[]>(`${environment.api}/lessons/teacher/my-lessons`);
  }

  getHomeworks() {
    return this.http.get<any[]>(`${environment.api}/homeworks/teacher/my-homeworks`);
  }
  getHomework(id: string) {
    return this.http.get<any>(`${environment.api}/homeworks/${id}`);
  }
  gradeSubmission(submissionId: number | string, score: number, comment: string) {
    return this.http.patch(`${environment.api}/homeworks/submissions/${submissionId}/grade`, {
      score,
      comment,
    });
  }
  createHomework(dto: {
    lessonId: string;
    subjectId: string;
    teacherId: string;
    title: string;
    description: string;
    maxScore: number;
    deadline: string;
  }) {
    return this.http.post<any>(`${environment.api}/homeworks`, dto); // путь поправь под свой
  }
}
