import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-teacher-assignments-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './teacher-assignments-dialog.html',
  styleUrls: ['./teacher-assignments-dialog.scss'],
})
export class TeacherAssignmentsDialogComponent implements OnInit {
  disciplines: any[] = [];
  groups: any[] = [];
  assignments: any[] = [];

  loading = false;
  saving = false;

  form = new FormGroup({
    disciplineId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    groupId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      teacherId: string;
      fullName: string;
    },

    private readonly dialogRef: MatDialogRef<TeacherAssignmentsDialogComponent>,
    private readonly adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.adminService.getDisciplines().subscribe({
      next: (disciplines) => {
        this.disciplines = disciplines;
      },
    });

    this.adminService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
      },
    });

    this.loadAssignments();
  }

  loadAssignments(): void {
    this.adminService.getTeacherAssignments(this.data.teacherId).subscribe({
      next: (assignments) => {
        this.assignments = assignments;
        this.loading = false;
      },

      error: () => {
        this.loading = false;
      },
    });
  }

  assign(): void {
    if (this.form.invalid || this.saving) {
      return;
    }

    this.saving = true;

    this.adminService.assignTeacher(this.data.teacherId, this.form.getRawValue()).subscribe({
      next: (assignment) => {
        this.assignments = [assignment, ...this.assignments];

        this.form.reset({
          disciplineId: '',
          groupId: '',
        });

        this.saving = false;
      },

      error: (err) => {
        console.error(err);
        this.saving = false;
      },
    });
  }

  remove(assignmentId: string): void {
    this.adminService.deleteTeacherAssignment(this.data.teacherId, assignmentId).subscribe({
      next: () => {
        this.assignments = this.assignments.filter((item) => item.id !== assignmentId);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
