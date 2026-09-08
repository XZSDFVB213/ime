import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherAssignmentsDialog } from './teacher-assignments-dialog';

describe('TeacherAssignmentsDialog', () => {
  let component: TeacherAssignmentsDialog;
  let fixture: ComponentFixture<TeacherAssignmentsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherAssignmentsDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherAssignmentsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
