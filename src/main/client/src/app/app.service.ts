import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfiguration } from './app-configuration';

@Injectable({
  providedIn: 'root'
})
export class AppService {

   http: HttpClient;
  constructor(
    private translateService: TranslateService,
    private snackBar: MatSnackBar,
    private config: AppConfiguration) { 
      this.http = inject(HttpClient);
    }

    showSnackBar(s: string, r: string = '', error: boolean = false, duration: number = 2000) {
      const right = r !== '' ? this.translateService.instant(r) : '';
      const clazz = error ? 'app-snack-error' : 'app-snack-success';
      this.snackBar.open(this.translateService.instant(s), right, {
        duration,
        verticalPosition: 'top',
        panelClass: clazz
      });
    }

    showSnackBarError(s: string, r: string = '') {
      this.showSnackBar(s, r, true, 5000);
    }
  
  private get<T>(url: string, params: HttpParams = new HttpParams(), responseType?: any): Observable<T> {
    // const r = re ? re : 'json';
    const headers = new HttpHeaders({
      'Accept-Language': 'cs'
    })
    // const options = { params, responseType, headers, withCredentials: true  };
    const options = { params, responseType  };
    return this.http.get<T>(`${this.config.context}api${url}`, options);

  }

  private post(url: string, obj: any) {
    const headers = new HttpHeaders({
      'Accept-Language': 'cs'
    })
    const options = { headers, withCredentials: true };
    return this.http.post<any>(`${this.config.context}api${url}`, obj, options);
  }
  
  /**
   * Fired search in results page
   * @param params the params
   */
  getDocuments() {
    const params: HttpParams = new HttpParams();
    return this.http.get('api/data/documents')
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

  findTags(text: any, tenant: string) {
    return this.post(`/data/find_tags?tenant=${tenant}`, text);
  }

  detectLang(text: any) {
    return this.post(`/data/detect_lang`, text);
  }

  translate(text: any) {
    return this.post(`/data/translate`, text);
  }

  translateToEn(text: any) {
    return this.post(`/data/translate_to_en`, text);
  }

  annotate(data: any) {
    return this.post(`/data/annotate`, data);
  }

  analyzeImages(data: any) {
    return this.post(`/data/analyze_images`, data);
  }

  saveFile(filename: string, data: any) {
    const url = `/data/save_config?filename=${filename}`;
    return this.post(url, data);
  }

  checkFileExists(filename: string, ) {
    const url = `/data/check_file_exists?name=${filename}`;
    return this.get(url);
  }

  getLetters(filename: string, sort: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('filename', filename)
    .set('sort', sort);
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

  checkAuthors(name: string, tenant: string, extended: boolean): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('name', name).set('tenant', tenant).set('extended', extended);
    return this.get(`/data/check_authors`, params);
    
  }

  checkPlaces(name: string, tenant: string, extended: boolean): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('name', name).set('tenant', tenant).set('extended', extended);
    return this.get(`/data/check_places`, params);
    
  }

  getKeywords(prefix: string, tenant: string, extended: boolean): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('prefix', prefix).set('tenant', tenant).set('extended', extended);
    return this.get(`/data/get_keywords`, params);
    
  }

  getAuthors(prefix: string, tenant: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('prefix', prefix).set('tenant', tenant);
    return this.get(`/data/get_authors`, params);
    
  }

  getLocations(prefix: string, tenant: string, type: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('prefix', prefix).set('tenant', tenant).set('type', type);
    return this.get(`/data/get_locations`, params);
    
  }

  getAllLocations(tenant: string): Observable<any> {
    const params: HttpParams = new HttpParams()
    .set('prefix', '').set('tenant', tenant).set('type', '');
    return this.get(`/data/get_locations`, params);
    
  }

  regeneratePageAlto(filename: string, page: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('filename', filename)
    .set('page', page);
    return this.get(`/convert/alto_image`, params);
    
  }

  regenerateAlto(filename: string): Observable<string> {
    const params: HttpParams = new HttpParams()
    .set('file', filename)
    .set('overwrite', 'true');
    return this.get(`/convert/alto`, params);
    
  }

  getPrompt(): Observable<any> {
    return this.get(`/data/get_prompt`,);
  }  

  savePrompt(data: any) {
    const url = `/data/save_prompt`;
    return this.post(url, data);
  }

  saveLocation(data: any) {
    const url = `/data/save_location`;
    return this.post(url, data);
  }

  importFromHiko(id: string, tenant: string) {
    const params: HttpParams = new HttpParams()
    .set('id', id)
    .set('tenant', tenant);
    return this.get(`/data/get_letter_hiko`, params); 
  }

  exportToHiko(data: any, tenant: string) {
    const url = `/data/save_letter_hiko?tenant=${tenant}`;
    return this.post(url, data);
  }

  login(data: any, tenant: string) {
    const url = `/data/login?tenant=${tenant}`;
    return this.post(url, data);
  }

  logout(tenant: string) {
    const url = `/user/logout?tenant=${tenant}`;
    return this.post(url, {});
  }

  
  synchronize(type: string) {
    const url = `/data/index_hiko?type=${type}`;
    return this.get(url);
  }

}
