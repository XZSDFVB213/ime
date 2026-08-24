import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherHomeworks } from './teacher-homeworks';

describe('TeacherHomeworks', () => {
  let component: TeacherHomeworks;
  let fixture: ComponentFixture<TeacherHomeworks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherHomeworks],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherHomeworks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
