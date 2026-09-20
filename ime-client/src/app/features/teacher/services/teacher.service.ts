import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface TeacherSemester {
  id: string;
  name: string;
  number: number;

  academicYear: {
    id: string;
    year: number;
  };
}
export type AssessmentResult =
  'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY' | 'PASSED' | 'NOT_PASSED';

export interface LessonAssessmentDto {
  studentId: string;
  result: AssessmentResult;
  comment?: string;
}

export interface CreateLessonDto {
  subjectId: string;
  groupId: string;
  semesterId: string;

  title: string;

  type: 'LECTURE' | 'PRACTICE' | 'SEMINAR' | 'LAB' | 'CONSULTATION' | 'CREDIT' | 'EXAM';

  date: string;
  duration: number;

  description?: string;
  location?: string;
}
export interface TeacherSubject {
  id: string;

  name: string;

  code: string | null;

  description?: string | null;

  credits: number;

  department?: {
    id: string;
    name: string;
  } | null;

  groups: {
    id: string;
    name: string;
  }[];

  lessonsCount: number;

  homeworksCount: number;

  submissionsCount: number;

  pendingCount: number;

  averagePercent: number;

  nextLesson: {
    id?: string;

    date: string;

    location?: string | null;

    group?: {
      id: string;
      name: string;
    } | null;
  } | null;
}
@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private http = inject(HttpClient);

  getSubjects() {
    return this.http.get<TeacherSubject[]>(`${environment.api}/subject-teachers/subjects`);
  }
  getMe() {
    return this.http.get<any>(`${environment.api}/auth/me`);
  }
  getSemesters() {
    return this.http.get<TeacherSemester[]>(`${environment.api}/lessons/teacher/semesters`);
  }

  createLesson(dto: CreateLessonDto) {
    return this.http.post<any>(`${environment.api}/lessons`, dto);
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
 
  deleteHomework(homeworkId: string) {
    return this.http.delete(`${environment.api}/homeworks/${homeworkId}`);
  }
  uploadMaterial(formData: FormData) {
    return this.http.post<any>(`${environment.api}/materials/upload`, formData);
  }

  deleteMaterial(id: string) {
    return this.http.delete<any>(`${environment.api}/materials/${id}`);
  }

  getLessonAssessments(lessonId: string) {
    return this.http.get<any>(`${environment.api}/lessons/teacher/${lessonId}/assessments`);
  }

  saveLessonAssessments(lessonId: string, assessments: LessonAssessmentDto[]) {
    return this.http.patch<any>(`${environment.api}/lessons/teacher/${lessonId}/assessments`, {
      assessments,
    });
  }

  deleteLesson(lessonId: string) {
    return this.http.delete(`${environment.api}/lessons/${lessonId}`);
  }
}
