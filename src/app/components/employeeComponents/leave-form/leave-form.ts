import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, DateAdapter, NativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

// Custom DateAdapter for DD/MM/YYYY format
@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${this._to2digit(day)}/${this._to2digit(month)}/${year}`;
    }
    return date.toDateString();
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value) {
      // Parse DD/MM/YYYY format
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (this.isValidDate(date)) {
          return date;
        }
      }
    }
    return super.parse(value);
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private _to2digit(n: number): string {
    return ('00' + n).slice(-2);
  }
}

// Custom date format: DD/MM/YYYY
export const DD_MM_YYYY_FORMAT = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-leave-form',
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSelectModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MM_YYYY_FORMAT }
  ],
  templateUrl: './leave-form.html',
  styleUrl: './leave-form.css',
})
export class LeaveForm implements OnInit {
  leaveForm!: FormGroup;

  selectedFile: File | null = null;
  selectedFileName: string = '';
  isImagePreview: boolean = false;
  errors: any = {};
  isLoading = false;
  editMode = false;
  leaveId: string | null = null;

  leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Other'];

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.leaveForm = this.fb.group({
      userId: [''],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', Validators.required],
      leaveType: ['', Validators.required],
      file: ['', Validators.required]
    });
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.leaveForm.patchValue({ userId: currentUser.id });
    }

    const navigation = window.history.state;
    if (navigation && navigation.leaveData) {
      const leaveData = navigation.leaveData;
      this.editMode = true;
      this.leaveId = leaveData._id;
      this.leaveForm.patchValue({
        userId: leaveData.userId,
        startDate: leaveData.startDate ? new Date(leaveData.startDate) : null,
        endDate: leaveData.endDate ? new Date(leaveData.endDate) : null,
        reason: leaveData.reason,
        leaveType: leaveData.leaveType,
        file: leaveData.file
      });
      // Set filename for edit mode if file exists
      if (leaveData.file) {
        this.selectedFileName = 'File attached';
        // Check if it's a base64 image (starts with data:image)
        this.isImagePreview = leaveData.file.startsWith('data:image');
      }
    }

    // Reset end date when start date changes
    this.leaveForm.get('startDate')?.valueChanges.subscribe(() => {
      const endDate = this.leaveForm.get('endDate')?.value;
      const startDate = this.leaveForm.get('startDate')?.value;
      if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
        this.leaveForm.patchValue({ endDate: null });
      }
    });
  }

  // Date filter for start date - disable dates before today
  startDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  // Date filter for end date - disable dates before start date
  endDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const startDate = this.leaveForm.get('startDate')?.value;
    if (!startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }
    const minDate = new Date(startDate);
    minDate.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= minDate;
  };

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.isImagePreview = this.isImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.leaveForm.patchValue({ file: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  isImageFile(file: File | null): boolean {
    if (!file) return false;
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(file.type);
  }

  validateForm(): boolean {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return false;
    }

    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;

    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        this.leaveForm.get('endDate')?.setErrors({ invalidEndDate: true });
        return false;
      }
    }

    return true;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const formValue = this.leaveForm.value;
    const requestData = {
      ...formValue,
      startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : '',
      endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : ''
    };

    if (this.editMode && this.leaveId) {
      this.leaveService.updateLeaveRequest(this.leaveId, requestData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastr.success('Leave request updated successfully!');
          setTimeout(() => {
            this.router.navigate(['/employee/view-leave']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(error.error?.message || 'Failed to update leave request');
        }
      });
    } else {
      this.leaveService.addLeaveRequest(requestData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastr.success('Leave request submitted successfully!');
          this.resetForm();
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(error.error?.message || 'Failed to submit leave request');
        }
      });
    }
  }

  resetForm() {
    const currentUser = this.authService.getCurrentUser();
    this.leaveForm.reset({
      userId: currentUser?.id || '',
      startDate: null,
      endDate: null,
      reason: '',
      leaveType: '',
      file: ''
    });
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isImagePreview = false;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  goToHistory() {
    this.router.navigate(['/employee/view-leave']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
