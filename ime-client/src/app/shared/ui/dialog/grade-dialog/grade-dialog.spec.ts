import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeDialog } from './grade-dialog';

describe('GradeDialog', () => {
  let component: GradeDialog;
  let fixture: ComponentFixture<GradeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(GradeDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
