import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFacultyDialog } from './create-faculty-dialog';

describe('CreateFacultyDialog', () => {
  let component: CreateFacultyDialog;
  let fixture: ComponentFixture<CreateFacultyDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFacultyDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateFacultyDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
