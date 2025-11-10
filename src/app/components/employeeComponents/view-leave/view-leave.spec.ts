import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewLeave } from './view-leave';

describe('ViewLeave', () => {
  let component: ViewLeave;
  let fixture: ComponentFixture<ViewLeave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewLeave]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewLeave);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
