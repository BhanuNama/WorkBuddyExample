import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';

// Components
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { LeaveForm } from './components/employeeComponents/leave-form/leave-form';
import { ViewLeave } from './components/employeeComponents/view-leave/view-leave';
import { LeaveRequests } from './components/managerComponents/leave-requests/leave-requests';

// Services
import { AuthService } from './services/auth.service';
import { LeaveService } from './services/leave.service';
import { UserService } from './services/user.service';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    SignupComponent,
    LeaveForm,
    ViewLeave,
    LeaveRequests
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true
    })
  ],
  providers: [
    AuthService,
    LeaveService,
    UserService
  ],
  bootstrap: [App]
})
export class AppModule { }

