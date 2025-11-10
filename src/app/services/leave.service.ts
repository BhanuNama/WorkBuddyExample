import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveRequest, LeaveRequestResponse } from '../models/leave-request.model';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = 'http://localhost:3000/leave';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAllLeaveRequests(params: any): Observable<LeaveRequestResponse> {
    return this.http.post<LeaveRequestResponse>(
      `${this.apiUrl}/getAllLeaveRequests`,
      params,
      { headers: this.getHeaders() }
    );
  }

  getLeaveRequestById(id: string): Observable<LeaveRequest> {
    return this.http.get<LeaveRequest>(
      `${this.apiUrl}/getLeaveRequestById/${id}`,
      { headers: this.getHeaders() }
    );
  }

  addLeaveRequest(leaveRequest: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/addLeaveRequest`,
      leaveRequest,
      { headers: this.getHeaders() }
    );
  }

  updateLeaveRequest(id: string, leaveRequest: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/updateLeaveRequest/${id}`,
      leaveRequest,
      { headers: this.getHeaders() }
    );
  }

  getLeaveRequestsByUserId(userId: string): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(
      `${this.apiUrl}/getLeaveRequestsByUserId/${userId}`,
      { headers: this.getHeaders() }
    );
  }

  deleteLeaveRequest(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/deleteLeaveRequest/${id}`,
      { headers: this.getHeaders() }
    );
  }
}

