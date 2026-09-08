import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDetailsDialog } from './group-details-dialog';

describe('GroupDetailsDialog', () => {
  let component: GroupDetailsDialog;
  let fixture: ComponentFixture<GroupDetailsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupDetailsDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupDetailsDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
