import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User, LoginRequest } from '../models/user.model';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly roleSubject = new BehaviorSubject<string | null>(null);
  private readonly idSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable();
  id$ = this.idSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly toastr: ToastrService) { }

  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/signup`, user);
  }

  login(login: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/login`, login).pipe(
      tap(data => {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('id', data.id);
        localStorage.setItem('userName', data.userName);
        this.roleSubject.next(data.role);
        this.idSubject.next(data.id);
      })
    );
  }

  isLoggedin(): boolean {
    return !!localStorage.getItem('authToken');
  }

  logout(): void {
    this.toastr.success("Logged Out Successfully!");
    localStorage.clear();
  }

  isManager(): boolean {
    return (localStorage.getItem('role') === 'Manager');
  }
}
