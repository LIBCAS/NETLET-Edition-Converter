import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AltoBlock } from './shared/alto';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) { }
  
  private get<T>(url: string, params: HttpParams = new HttpParams(), responseType?: any): Observable<T> {
    // const r = re ? re : 'json';
    const options = { params, responseType, withCredentials: true };
    return this.http.get<T>(`/api${url}`, options);

  }

  private post(url: string, obj: any) {
    return this.http.post<any>(`/api${url}`, obj);
  }
  
  /**
   * Fired search in results page
   * @param params the params
   */
  getDocuments() {
    const params: HttpParams = new HttpParams();
    return this.get(`/data/documents`, params);
  }

  getDocument(file: string) {
    const params: HttpParams = new HttpParams()
    .set('file', file);
    return this.get(`/data/document`, params);
  }

  getConfig(file: string) {
    const params: HttpParams = new HttpParams()
    .set('filename', file);
    return this.get(`/data/config`, params);
  }

  getAlto(filename: string, page: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('filename', filename)
    .set('page', page);
    return this.get(`/data/alto`, params);
    
  }

  findSimilar(params: any) {
    return this.post(`/data/find`, params);
  }

  findTags(text: any) {
    return this.post(`/data/find_tags`, text);
  }

  detectLang(text: any) {
    return this.post(`/data/detect_lang`, text);
  }

  translate(text: any) {
    return this.post(`/data/translate`, text);
  }

  annotate(data: any) {
    return this.post(`/data/annotate`, data);
  }

  saveFile(filename: string, data: any) {
    const url = `/data/save_config?filename=${filename}`;
    return this.post(url, data);
  }

  getLetters(filename: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('filename', filename);
    return this.get(`/data/get_letters`, params);
    
  }

  getLetter(id: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('id', id);
    return this.get(`/data/get_letter`, params);
    
  }

  saveLetter(filename: string, data: any) {
    const url = `/data/save_letter?filename=${filename}`;
    return this.post(url, data);
  }

  removeLetter(filename: string, id: string) {
    const url = `/data/remove_letter?filename=${filename}&id=${id}`;
    return this.get(url);
  }

}