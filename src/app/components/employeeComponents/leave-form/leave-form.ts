import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-leave-form',
  templateUrl: './leave-form.html',
  styleUrls: ['./leave-form.css'],
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
      
      if (leaveData.file) {
        this.selectedFileName = 'File attached';
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

  // Simple date filter for start date - only allow today or future dates
  startDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // Simple date filter for end date - must be after start date
  endDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const startDate = this.leaveForm.get('startDate')?.value;
    if (!startDate) {
      return this.startDateFilter(date);
    }
    const minDate = new Date(startDate);
    minDate.setHours(0, 0, 0, 0);
    return date >= minDate;
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
      if (new Date(endDate) < new Date(startDate)) {
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
    
    // Convert Date objects to ISO string (Material datepicker returns Date objects)
    const formatDate = (date: Date | string | null): string => {
      if (!date) return '';
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '';
      dateObj.setHours(0, 0, 0, 0);
      return dateObj.toISOString();
    };
    
    const requestData = {
      ...formValue,
      startDate: formatDate(formValue.startDate),
      endDate: formatDate(formValue.endDate)
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
          setTimeout(() => {
            this.router.navigate(['/employee/view-leave']);
          }, 1500);
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
