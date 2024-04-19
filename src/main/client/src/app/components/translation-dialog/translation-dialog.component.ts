import { NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { AppService } from 'src/app/app.service';

@Component({
  selector: 'app-translation-dialog',
  templateUrl: './translation-dialog.component.html',
  styleUrls: ['./translation-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslateModule, NgIf,
    MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule, MatProgressBarModule]
})
export class TranslationDialogComponent {

  resp: {text: string, lang: string};
  loading = true;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    private service: AppService
    ) { }

  ngOnInit() {
    this.translate();
  }
  translate() {
    this.loading = true;
    this.service.translate(this.data).subscribe((resp: any) => {
        this.resp = resp;
        this.loading = false;
    });
  }
}
