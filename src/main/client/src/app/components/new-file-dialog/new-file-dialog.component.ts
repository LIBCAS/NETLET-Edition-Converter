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
import { MatCheckbox } from "@angular/material/checkbox";
import { AppService } from 'src/app/app.service';

@Component({
  selector: 'app-new-file-dialog',
  templateUrl: './new-file-dialog.component.html',
  styleUrls: ['./new-file-dialog.component.scss'],
  standalone: true,
  imports: [FileUploadModule,
    CommonModule, TranslateModule, FormsModule, MatAutocompleteModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
    MatDividerModule, MatProgressBarModule, MatDialogModule, MatCheckbox]
})
export class NewFileDialogComponent {

  name: string;
  columns: number;
  def_author: string;
  def_recipient: string;

  public uploader: FileUploader = new FileUploader({ url: 'api/upload' });
  selectedFile: string;
  progressMsg: string;

  overwrite: boolean;

  constructor(
    private dialogRef: MatDialogRef<NewFileDialogComponent>,
    public state: AppState,
    private service: AppService
  ) { }


  onFileSelected(e: any) {
    console.log(e)
    const file: File = e.target.files[0];
    if (file) {
      this.selectedFile = file.name;
    }
  }

  checkUpload() {
    if (this.overwrite) {
      this.uploadFile();
      return;
    }
    this.service.checkFileExists(this.selectedFile).subscribe((resp: any) => {
      if (resp.exists) {
        alert('File already exists. Check option to overwrite');
      } else {
        this.uploadFile()
      }
    })
  }

  uploadFile() {
    const opts: FileUploaderOptions = {
      url: 'api/upload',
      additionalParameter: {
        name: this.name ? this.name : this.selectedFile,
        columns: this.columns,
        def_author: this.def_author,
        def_recipient: this.def_recipient,
        tenant: this.state.user.tenant,
        overwrite: this.overwrite
      }
    };
    this.progressMsg = 'uploading...'
    this.uploader.setOptions(opts);
    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => this.fileUploaded(JSON.parse(response));
    this.uploader.uploadAll();
  }

  fileUploaded(response: any) {
    console.log(response, response['error'])
    if(response.error && response.error === 'file_exists') {
      alert('File with this name already exists');
      this.uploader.cancelAll();
    } else {
      this.progressMsg = response.msg;
    }
  }

}
