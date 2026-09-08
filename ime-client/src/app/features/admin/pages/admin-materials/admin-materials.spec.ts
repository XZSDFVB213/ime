import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMaterials } from './admin-materials';

describe('AdminMaterials', () => {
  let component: AdminMaterials;
  let fixture: ComponentFixture<AdminMaterials>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMaterials],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminMaterials);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
