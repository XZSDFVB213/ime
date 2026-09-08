import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTeacherDialog } from './create-teacher-dialog';

describe('CreateTeacherDialog', () => {
  let component: CreateTeacherDialog;
  let fixture: ComponentFixture<CreateTeacherDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTeacherDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTeacherDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
