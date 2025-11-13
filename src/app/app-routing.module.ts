import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { LeaveFormComponent } from './components/employeeComponents/leave-form/leave-form';
import { ViewLeaveComponent } from './components/employeeComponents/view-leave/view-leave';
import { LeaveRequests } from './components/managerComponents/leave-requests/leave-requests';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  
  // Employee routes
  { path: 'employee/leave-form', component: LeaveFormComponent },
  { path: 'employee/view-leave', component: ViewLeaveComponent },
  
  // Manager routes
  { path: 'manager/leave-requests', component: LeaveRequests },
  
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

