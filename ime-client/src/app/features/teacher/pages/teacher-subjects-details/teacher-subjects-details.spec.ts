import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherSubjectsDetails } from './teacher-subjects-details';

describe('TeacherSubjectsDetails', () => {
  let component: TeacherSubjectsDetails;
  let fixture: ComponentFixture<TeacherSubjectsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherSubjectsDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherSubjectsDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
