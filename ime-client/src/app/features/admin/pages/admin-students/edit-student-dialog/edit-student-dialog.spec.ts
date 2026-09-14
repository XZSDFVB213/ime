import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditStudentDialog } from './edit-student-dialog';

describe('EditStudentDialog', () => {
  let component: EditStudentDialog;
  let fixture: ComponentFixture<EditStudentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditStudentDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditStudentDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
