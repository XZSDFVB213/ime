import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherSubjects } from './teacher-subjects';

describe('TeacherSubjects', () => {
  let component: TeacherSubjects;
  let fixture: ComponentFixture<TeacherSubjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherSubjects],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherSubjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
