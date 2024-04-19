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

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: true,
    imports: [RouterLink, FileUploadModule,
      CommonModule, TranslateModule, FormsModule,
      MatFormFieldModule, MatInputModule, MatButtonModule,
      MatDividerModule, MatProgressBarModule]
})
export class HomeComponent {
  files: {dir: string[], config: FileConfig}[] = [];
  public uploader: FileUploader = new FileUploader({ url: 'api/lf?action=UPLOAD' });
  selectedFile: string;
  progressMsg: string;

  constructor(private service: AppService) {}

  ngOnInit() {
    this.getFiles();
  }

  onFileSelected(e: any) {
    const file: File = e.target.files[0];
    if (file) {
      this.selectedFile = file.name;
    }
  }

  getFiles() {
    this.service.getDocuments().subscribe((res: any) => {
      this.files = res.dirs;
    });
  }

  uploadFile() {
    this.progressMsg = 'uploading...'
    this.uploader.setOptions({ url: 'api/data/pdf' });
    this.uploader.onSuccessItem = (item: any, response: any, status: any, headers: any) => this.fileUploaded();
    this.uploader.uploadAll();
  }

  fileUploaded() {
    this.progressMsg = 'file uploaded';
    this.getFiles();
  }

}
