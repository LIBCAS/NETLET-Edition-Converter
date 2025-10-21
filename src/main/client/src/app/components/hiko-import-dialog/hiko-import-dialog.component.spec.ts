import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HikoImportDialogComponent } from './hiko-import-dialog.component';

describe('HikoImportDialogComponent', () => {
  let component: HikoImportDialogComponent;
  let fixture: ComponentFixture<HikoImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HikoImportDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HikoImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
