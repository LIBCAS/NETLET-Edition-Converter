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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [RouterLink, FileUploadModule, MatTooltipModule,
    CommonModule, TranslateModule, FormsModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
    MatDividerModule, MatProgressBarModule, MatDialogModule, MatCardModule, MatTableModule]
})
export class HomeComponent {
  displayedColumns: string[] = ['filename', 'pages', 'letters', 'action'];

  constructor(
    public dialog: MatDialog,
    public state: AppState,
    private service: AppService) { }

  ngOnInit() {
    this.getDocuments();
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
        this.getDocuments();
      }
      
    })
  }

  getDocuments() {
    this.service.getDocuments().subscribe((res: any) => {
      this.state.tenants = Object.keys(res.tenants);
      this.state.files = res.dirs;
      this.state.files.sort((f1, f2) => f1.config.name.localeCompare(f2.config.name, 'cs-CZ'));
      this.state.files.forEach(f => {
        f.letters = res.totals[f.filename] ? res.totals[f.filename] : 0;
      });
    });
  }

}
