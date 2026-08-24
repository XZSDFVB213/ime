import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentHomeworkDetails } from './student-homework-details';

describe('StudentHomeworkDetails', () => {
  let component: StudentHomeworkDetails;
  let fixture: ComponentFixture<StudentHomeworkDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentHomeworkDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentHomeworkDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
