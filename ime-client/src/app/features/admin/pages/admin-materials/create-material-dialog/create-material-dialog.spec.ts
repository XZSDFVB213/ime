import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMaterialDialog } from './create-material-dialog';

describe('CreateMaterialDialog', () => {
  let component: CreateMaterialDialog;
  let fixture: ComponentFixture<CreateMaterialDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMaterialDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateMaterialDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
