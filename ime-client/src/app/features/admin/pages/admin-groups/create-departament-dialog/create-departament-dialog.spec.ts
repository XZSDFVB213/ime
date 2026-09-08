import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDepartamentDialog } from './create-departament-dialog';

describe('CreateDepartamentDialog', () => {
  let component: CreateDepartamentDialog;
  let fixture: ComponentFixture<CreateDepartamentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDepartamentDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateDepartamentDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
