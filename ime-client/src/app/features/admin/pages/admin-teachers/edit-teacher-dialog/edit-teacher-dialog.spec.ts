import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTeacherDialog } from './edit-teacher-dialog';

describe('EditTeacherDialog', () => {
  let component: EditTeacherDialog;
  let fixture: ComponentFixture<EditTeacherDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTeacherDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTeacherDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
