import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentLibrary } from './student-library';

describe('StudentLibrary', () => {
  let component: StudentLibrary;
  let fixture: ComponentFixture<StudentLibrary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentLibrary],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentLibrary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
