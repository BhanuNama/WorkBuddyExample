import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { LeaveForm } from './components/employeeComponents/leave-form/leave-form';
import { ViewLeave } from './components/employeeComponents/view-leave/view-leave';
import { LeaveRequests } from './components/managerComponents/leave-requests/leave-requests';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  
  // Employee routes
  { path: 'employee/leave-form', component: LeaveForm },
  { path: 'employee/view-leave', component: ViewLeave },
  
  // Manager routes
  { path: 'manager/leave-requests', component: LeaveRequests },
  
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

