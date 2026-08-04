import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHomeworkDialog } from './create-homework-dialog';

describe('CreateHomeworkDialog', () => {
  let component: CreateHomeworkDialog;
  let fixture: ComponentFixture<CreateHomeworkDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHomeworkDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateHomeworkDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
