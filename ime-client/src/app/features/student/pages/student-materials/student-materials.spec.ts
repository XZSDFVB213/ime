import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentMaterials } from './student-materials';

describe('StudentMaterials', () => {
  let component: StudentMaterials;
  let fixture: ComponentFixture<StudentMaterials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentMaterials],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentMaterials);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
