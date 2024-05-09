import { Component } from '@angular/core';
import { AppService } from 'src/app/app.service';
import { RouterLink } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { FileUploadModule, FileUploader } from 'ng2-file-upload';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { FileConfig } from 'src/app/shared/file-config';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewFileDialogComponent } from 'src/app/components/new-file-dialog/new-file-dialog.component';
import { AppState } from 'src/app/app-state';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [RouterLink, FileUploadModule, MatTooltipModule,
      CommonModule, TranslateModule, FormsModule, MatIconModule,
      MatFormFieldModule, MatInputModule, MatButtonModule,
      MatDividerModule, MatProgressBarModule, MatDialogModule]
})
export class HomeComponent {

  constructor(
    public dialog: MatDialog,
    public state: AppState,
    private service: AppService) {}

  ngOnInit() {
    // this.getFiles();
  }

  regenerateAlto(file: string) {
    this.service.regenerateAlto(file).subscribe((res: any) => {
      // this.getLetters();
      this.service.showSnackBar(res)
    });

  }

  newFile() {
    const dialogRef = this.dialog.open(NewFileDialogComponent, {
      width: '800px',
      // height: '600px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      // console.log(result);
      if (result) {
        
      }
    })
  }

}
