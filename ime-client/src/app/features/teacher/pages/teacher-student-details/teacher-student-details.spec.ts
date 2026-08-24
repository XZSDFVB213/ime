import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherStudentDetails } from './teacher-student-details';

describe('TeacherStudentDetails', () => {
  let component: TeacherStudentDetails;
  let fixture: ComponentFixture<TeacherStudentDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherStudentDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherStudentDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
