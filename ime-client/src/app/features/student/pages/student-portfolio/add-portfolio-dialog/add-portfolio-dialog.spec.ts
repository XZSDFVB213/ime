import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPortfolioDialog } from './add-portfolio-dialog';

describe('AddPortfolioDialog', () => {
  let component: AddPortfolioDialog;
  let fixture: ComponentFixture<AddPortfolioDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPortfolioDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(AddPortfolioDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
