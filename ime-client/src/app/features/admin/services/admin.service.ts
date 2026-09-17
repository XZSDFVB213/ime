import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
export interface AdminSemester {
  id: string;
  name: string;
  number: number;
  academicYearId: string;
  createdAt: string;
}


export interface AdminAcademicYear {
  id: string;
  year: number;
  createdAt: string;

  semesters: AdminSemester[];
}
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getUsers(role?: string) {
    const url = role
      ? `${environment.api}/admin/users?role=${role}`
      : `${environment.api}/admin/users`;

    return this.http.get<any[]>(url);
  }
getAcademicYears() {
  return this.http.get<
    AdminAcademicYear[]
  >(
    `${environment.api}/admin/academic-years`,
  );
}


createAcademicYear(
  year: number,
) {
  return this.http.post<
    AdminAcademicYear
  >(
    `${environment.api}/admin/academic-years`,
    {
      year,
    },
  );
}
  getStudents() {
    return this.getUsers('STUDENT');
  }

  getTeachers() {
    return this.getUsers('TEACHER');
  }

  getGroups() {
    return this.http.get<any[]>(`${environment.api}/admin/groups`);
  }

  getDepartments() {
    return this.http.get<any[]>(`${environment.api}/admin/departments`);
  }

  createStudent(dto: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    groupId: string;
  }) {
    return this.http.post(`${environment.api}/admin/students`, dto);
  }

  createTeacher(dto: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    position?: string;
    departmentIds: string[];
  }) {
    return this.http.post(`${environment.api}/admin/teachers`, dto);
  }

  assignStudentToGroup(studentId: string, groupId: string) {
    return this.http.patch(`${environment.api}/admin/students/${studentId}/group`, {
      groupId,
    });
  }
  getsubjects() {
    return this.http.get<any[]>(`${environment.api}/admin/subjects`);
  }

  getTeacherAssignments(teacherId: string) {
    return this.http.get<any[]>(`${environment.api}/admin/teachers/${teacherId}/assignments`);
  }
  deleteSubject(subjectId: string) {
    return this.http.delete(`${environment.api}/admin/subjects/${subjectId}`);
  }
  assignTeacher(
    teacherId: string,
    data: {
      subjectId: string;
      groupId: string;
    },
  ) {
    return this.http.post(`${environment.api}/admin/teachers/${teacherId}/assignments`, data);
  }
updateTeacher(
  teacherId: string,
  dto: {
    fullName: string;
    email: string;
    phone?: string;
    position?: string;
    departmentIds: string[];
    password?: string;
  },
) {
  return this.http.patch(
    `${environment.api}/admin/teachers/${teacherId}`,
    dto,
  );
}
  deleteTeacher(teacherId: string) {
    return this.http.delete(`${environment.api}/admin/teachers/${teacherId}`);
  }
  updateStudent(
    studentId: string,

    dto: {
      fullName: string;
      email: string;
      phone?: string;
      groupId: string;
      password?: string;
    },
  ) {
    return this.http.patch(`${environment.api}/admin/students/${studentId}`, dto);
  }

  deleteStudent(studentId: string) {
    return this.http.delete(`${environment.api}/admin/students/${studentId}`);
  }
  deleteTeacherAssignment(teacherId: string, assignmentId: string) {
    return this.http.delete(
      `${environment.api}/admin/teachers/${teacherId}/assignments/${assignmentId}`,
    );
  }
  getGroupAssignments(groupId: string) {
    return this.http.get<any[]>(`${environment.api}/admin/groups/${groupId}/assignments`);
  }
  getMaterials() {
    return this.http.get<any[]>(`${environment.api}/admin/materials`);
  }

  getMaterialSubjects() {
    return this.http.get<any[]>(`${environment.api}/admin/material-subjects`);
  }

  createLinkMaterial(dto: { title: string; description?: string; subjectId: string; url: string }) {
    return this.http.post(`${environment.api}/admin/materials/link`, dto);
  }

  createFileMaterial(dto: { title: string; description?: string; subjectId: string; file: File }) {
    const formData = new FormData();

    formData.append('title', dto.title);

    formData.append('subjectId', dto.subjectId);

    if (dto.description) {
      formData.append('description', dto.description);
    }

    formData.append('file', dto.file);

    return this.http.post(`${environment.api}/admin/materials/file`, formData);
  }

  deleteMaterial(materialId: string) {
    return this.http.delete(`${environment.api}/admin/materials/${materialId}`);
  }
  getSubjects() {
    return this.http.get<any[]>(`${environment.api}/admin/subjects`);
  }

  createSubject(dto: {
    name: string;
    code: string;
    description?: string;
    credits: number;
    departmentId: string;
  }) {
    return this.http.post(`${environment.api}/admin/subjects`, dto);
  }

  updateSubject(
    subjectId: string,

    dto: {
      name?: string;
      code?: string;
      description?: string;
      credits?: number;
      departmentId?: string;
    },
  ) {
    return this.http.patch(`${environment.api}/admin/subjects/${subjectId}`, dto);
  }
  getFaculties() {
    return this.http.get<any[]>(`${environment.api}/admin/faculties`);
  }

  createFaculty(dto: { name: string; shortName: string }) {
    return this.http.post(`${environment.api}/admin/faculties`, dto);
  }

  createDepartment(dto: { name: string; facultyId: string }) {
    return this.http.post(`${environment.api}/admin/departments`, dto);
  }

  createGroup(dto: { name: string; departmentId: string }) {
    return this.http.post(`${environment.api}/admin/groups`, dto);
  }
}
