import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentSubjects } from './student-subjects';

describe('StudentSubjects', () => {
  let component: StudentSubjects;
  let fixture: ComponentFixture<StudentSubjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentSubjects],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSubjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
