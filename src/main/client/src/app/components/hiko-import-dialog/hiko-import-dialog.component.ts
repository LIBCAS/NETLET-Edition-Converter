import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-hiko-import-dialog',
  standalone: true,
    imports: [FormsModule, TranslateModule,
      MatButtonModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
      MatInputModule, MatIconModule, MatDialogModule, MatListModule, MatButtonToggleModule, MatSlideToggleModule
    ],
  templateUrl: './hiko-import-dialog.component.html',
  styleUrl: './hiko-import-dialog.component.scss'
})
export class HikoImportDialogComponent {

  type: string = 'new_letter';
  id: string;
  onlyEmpty: boolean = true;


  constructor(
    private dialogRef: MatDialogRef<HikoImportDialogComponent>
  ) { }


  import(){
    this.dialogRef.close({new_letter: this.type === 'new_letter' ? true : false, onlyEmpty: this.onlyEmpty, id: this.id})
  }


}
