import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAcademicYearDialog } from './create-academic-year-dialog';

describe('CreateAcademicYearDialog', () => {
  let component: CreateAcademicYearDialog;
  let fixture: ComponentFixture<CreateAcademicYearDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAcademicYearDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAcademicYearDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
