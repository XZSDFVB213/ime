import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherLessonAssessments } from './teacher-lesson-assessments';

describe('TeacherLessonAssessments', () => {
  let component: TeacherLessonAssessments;
  let fixture: ComponentFixture<TeacherLessonAssessments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherLessonAssessments],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherLessonAssessments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
