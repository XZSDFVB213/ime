import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherCreateLesson } from './teacher-create-lesson';

describe('TeacherCreateLesson', () => {
  let component: TeacherCreateLesson;
  let fixture: ComponentFixture<TeacherCreateLesson>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherCreateLesson],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherCreateLesson);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
