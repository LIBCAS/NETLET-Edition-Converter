import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule, FileUploader, FileUploaderOptions } from 'ng2-file-upload';
import { AppState } from 'src/app/app-state';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-new-file-dialog',
  templateUrl: './new-file-dialog.component.html',
  styleUrls: ['./new-file-dialog.component.scss'],
  standalone: true,
  imports: [FileUploadModule,
    CommonModule, TranslateModule, FormsModule, MatAutocompleteModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
    MatDividerModule, MatProgressBarModule, MatDialogModule]
})
export class NewFileDialogComponent {

  name: string;
  columns: number;
  tenant: string;
  def_author: string;
  def_recipient: string;

  public uploader: FileUploader = new FileUploader({ url: 'api/upload' });
  selectedFile: string;
  progressMsg: string;

  constructor(
    private dialogRef: MatDialogRef<NewFileDialogComponent>,
    public state: AppState
  ) { }


  onFileSelected(e: any) {
    const file: File = e.target.files[0];
    if (file) {
      this.selectedFile = file.name;
    }
  }

  uploadFile() {
    const opts: FileUploaderOptions = {
      url: 'api/upload',
      additionalParameter: {
        name: this.name,
        columns: this.columns,
        def_author: this.def_author,
        def_recipient: this.def_recipient,
        tenant: this.tenant
      }
    };
    this.progressMsg = 'uploading...'
    this.uploader.setOptions(opts);
    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => this.fileUploaded();
    this.uploader.uploadAll();
  }

  fileUploaded() {
    this.progressMsg = 'file uploaded';
    // this.getFiles();
  }

}
