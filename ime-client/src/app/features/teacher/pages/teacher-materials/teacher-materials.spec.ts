import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherMaterials } from './teacher-materials';

describe('TeacherMaterials', () => {
  let component: TeacherMaterials;
  let fixture: ComponentFixture<TeacherMaterials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherMaterials],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherMaterials);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
