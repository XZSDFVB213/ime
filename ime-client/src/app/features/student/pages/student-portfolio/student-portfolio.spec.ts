import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentPortfolio } from './student-portfolio';

describe('StudentPortfolio', () => {
  let component: StudentPortfolio;
  let fixture: ComponentFixture<StudentPortfolio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentPortfolio],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentPortfolio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
