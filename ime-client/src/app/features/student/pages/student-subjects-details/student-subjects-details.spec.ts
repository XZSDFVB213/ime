import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentSubjectsDetails } from './student-subjects-details';

describe('StudentSubjectsDetails', () => {
  let component: StudentSubjectsDetails;
  let fixture: ComponentFixture<StudentSubjectsDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentSubjectsDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentSubjectsDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
