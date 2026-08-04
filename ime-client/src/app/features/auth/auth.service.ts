import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn:'root'
})
export class AuthService {

 private http = inject(HttpClient);

 private api = 'http://localhost:3000/auth';


 login(data:{
   email:string;
   password:string;
 }){
   return this.http.post<any>(
    `${this.api}/login`,
    data
   );
 }


}