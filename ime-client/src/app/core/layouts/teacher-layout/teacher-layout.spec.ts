import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherLayout } from './teacher-layout';

describe('TeacherLayout', () => {
  let component: TeacherLayout;
  let fixture: ComponentFixture<TeacherLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
