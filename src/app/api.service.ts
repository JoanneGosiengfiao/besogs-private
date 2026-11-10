import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { GlobalService } from './global.service';
import { log } from 'console';
import * as uuid from 'uuid';
import JSEncrypt from 'jsencrypt'; // Import the library
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  constructor(private http: Http, public global: GlobalService) { }

  getPublicAPICurrentServerTime() {
    return this.http.get(this.global.api + 'PublicAPI/CurrentServerTime', this.global.option)
  }

  getAuthUserRoles() {
    return this.http.get(this.global.api + 'Auth/UserRoles', this.global.option)
  }

  getPublicAPIDepartments() {
    return this.http.get(this.global.api + 'PublicAPI/Departments', this.global.option)
  }

  getPublicAPIProgramLevels() {
    return this.http.get(this.global.api + 'PublicAPI/ProgramLevels', this.global.option)
  }

  getAuthUserViewDomains() {
    return this.http.get(this.global.api + 'Auth/UserViewDomains', this.global.option)
  }

  getPublicAPISYOptionsList() {
    return this.http.get(this.global.api + 'PublicAPI/SYOptionsList', this.global.option)
  }

  getAuthUserInfo() {
    return this.http.get(this.global.api + 'Auth/UserInfo', this.global.option)
  }

  putAccountChangePassword(data) {
    return this.http.put(this.global.api + 'Account/ChangePassword', data, this.global.option)
  }

  postAuthlogin(data, option) {
    return this.http.post(this.global.api + 'Auth/login', data, option)
  }
  apiAuthUserInfo(option): Observable<any> {
    return this.http.get(this.global.api + 'Auth/UserInfo', option)
      .map(response => response.json())
  }
  apiUserLogin(username, password): Observable<any> {
    var header = new Headers();
    header.append("Content-Type", "application/json");
    var option = new RequestOptions({ headers: header });

    const id = this.global.tokenID;


    return this.http.get(this.global.api + 'Metadata', option).pipe(

      map(response => response.json()),
      switchMap(keyResponse => this.getPublicAPICurrentServerTime().pipe(
        map(response => ({ keyResponse, serverTime: response.json() }))
      )),

      switchMap(({ keyResponse, serverTime }) => {
        const rawPayload = {
          UserName: username,
          Password: password,
          AppName: 'BESOGS',
          AppId: id,
          Timestamp: new Date(serverTime.data).getTime(),
          Nonce: uuid.v4() // Generate a unique nonce for each request
        };

        if (isNaN(rawPayload.Timestamp)) {
          throw new Error('Invalid server time');
        }

        // Encrypt the payload
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(keyResponse.metadata);

        const jsonString = JSON.stringify(rawPayload);
        const encryptedString = encryptor.encrypt(jsonString);

        if (!encryptedString) {
          throw new Error('Encryption failed');
        }

        // Prepare the final payload expected by your .NET 10 backend
        const loginPayload = {
          EncryptedPayload: encryptedString
        };

        // 3. Return the POST request
        return this.http.post(this.global.api + 'Auth/UserLogin', loginPayload, option).pipe(
          map(res => res.json())
        );
      })
    );

  }

  getAccess(x = null) {
    if (x == null)
      x = this.global.requestid()

    return this.http.get(this.global.api + 'Access/' + x, this.global.option)
  }

  getPublicAPIOffices(active) {
    return this.http.get(this.global.api + 'PublicAPI/Offices?active=' + active, this.global.option)
  }


}
