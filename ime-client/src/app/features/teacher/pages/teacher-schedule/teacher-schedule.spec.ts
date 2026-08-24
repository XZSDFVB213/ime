import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherSchedule } from './teacher-schedule';

describe('TeacherSchedule', () => {
  let component: TeacherSchedule;
  let fixture: ComponentFixture<TeacherSchedule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherSchedule],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherSchedule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
