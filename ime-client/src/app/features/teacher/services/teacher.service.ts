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
    return this.http.get<any>(`${environment.api}/homeworks/teacher/${id}`);
  }

  gradeSubmission(
    submissionId: string,
    dto: {
      score: number;
      feedback: string;
    },
  ) {
    return this.http.patch<any>(
      `${environment.api}/homeworks/submissions/${submissionId}/grade`,
      dto,
    );
  }

  createHomework(dto: {
    lessonId: string;
    subjectId: string;
    title: string;
    description: string;
    deadline: string;
    maxScore: number;
  }) {
    return this.http.post<any>(`${environment.api}/homeworks`, dto);
  }
  getMaterials() {
    return this.http.get<any[]>(`${environment.api}/materials/teacher/my-materials`);
  }

  createLinkMaterial(dto: {
    title: string;
    description?: string;
    subjectId: string;
    lessonId?: string;
    url: string;
  }) {
    return this.http.post<any>(`${environment.api}/materials/link`, dto);
  }

  uploadMaterial(formData: FormData) {
    return this.http.post<any>(`${environment.api}/materials/upload`, formData);
  }

  deleteMaterial(id: string) {
    return this.http.delete<any>(`${environment.api}/materials/${id}`);
  }
}
