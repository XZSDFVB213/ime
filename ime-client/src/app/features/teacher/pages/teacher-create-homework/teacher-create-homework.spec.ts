import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherCreateHomework } from './teacher-create-homework';

describe('TeacherCreateHomework', () => {
  let component: TeacherCreateHomework;
  let fixture: ComponentFixture<TeacherCreateHomework>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherCreateHomework],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherCreateHomework);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
