import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicAccsess } from './public-accsess';

describe('PublicAccsess', () => {
  let component: PublicAccsess;
  let fixture: ComponentFixture<PublicAccsess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicAccsess],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicAccsess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
