import { DecimalPipe, JsonPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-info-usage-dialog',
  standalone: true,
  imports: [FormsModule, TranslateModule, JsonPipe, DecimalPipe, MatDialogModule, MatButtonModule ],
  templateUrl: './info-usage-dialog.component.html',
  styleUrl: './info-usage-dialog.component.scss'
})
export class InfoUsageDialogComponent {
total: number;
  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    usage: { completion_tokens: number, prompt_tokens: number, total_tokens: number},
    model: string 
  }) {}

  ngOnInit() {

    let price = this.data.model === 'gpt-3.5-turbo-0125' ? 5.00 / 1000000 : 0.5 / 1000000;
    // price = 0.00235;
    this.total = price * this.data.usage.total_tokens;
  }


}
