import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectDialogComponent } from './subject-dialog-component';

describe('SubjectDialogComponent', () => {
  let component: SubjectDialogComponent;
  let fixture: ComponentFixture<SubjectDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
