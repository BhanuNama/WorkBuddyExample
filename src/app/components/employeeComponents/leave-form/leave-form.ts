import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-leave-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-form.html',
  styleUrl: './leave-form.css',
})
export class LeaveForm implements OnInit {
  leaveForm = {
    userId: '',
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: '',
    file: ''
  };

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
    private router: Router
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.leaveForm.userId = currentUser.id;
    }

    const navigation = window.history.state;
    if (navigation && navigation.leaveData) {
      const leaveData = navigation.leaveData;
      this.editMode = true;
      this.leaveId = leaveData._id;
      this.leaveForm = {
        userId: leaveData.userId,
        startDate: this.formatDateForInput(leaveData.startDate),
        endDate: this.formatDateForInput(leaveData.endDate),
        reason: leaveData.reason,
        leaveType: leaveData.leaveType,
        file: leaveData.file
      };
      // Set filename for edit mode if file exists
      if (leaveData.file) {
        this.selectedFileName = 'File attached';
        // Check if it's a base64 image (starts with data:image)
        this.isImagePreview = leaveData.file.startsWith('data:image');
      }
    }
  }

  formatDateForInput(date: string): string {
    return date ? new Date(date).toISOString().split('T')[0] : '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.isImagePreview = this.isImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.leaveForm.file = reader.result as string;
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
    this.errors = {};
    let isValid = true;

    if (!this.leaveForm.startDate) {
      this.errors.startDate = 'Start Date is required';
      isValid = false;
    }

    if (!this.leaveForm.endDate) {
      this.errors.endDate = 'End Date is required';
      isValid = false;
    }

    if (!this.leaveForm.reason || !this.leaveForm.reason.trim()) {
      this.errors.reason = 'Reason is required';
      isValid = false;
    }

    if (!this.leaveForm.leaveType) {
      this.errors.leaveType = 'Leave Type is required';
      isValid = false;
    }

    if (!this.leaveForm.file) {
      this.errors.file = 'File is required';
      isValid = false;
    }

    if (this.leaveForm.startDate && this.leaveForm.endDate) {
      if (new Date(this.leaveForm.startDate) > new Date(this.leaveForm.endDate)) {
        this.errors.endDate = 'End Date must be after Start Date';
        isValid = false;
      }
    }

    return isValid;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const requestData = { ...this.leaveForm };

    if (this.editMode && this.leaveId) {
      this.leaveService.updateLeaveRequest(this.leaveId, requestData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccessToast('Leave request updated successfully!');
          setTimeout(() => {
            this.router.navigate(['/employee/view-leave']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorToast(error.error?.message || 'Failed to update leave request');
        }
      });
    } else {
      this.leaveService.addLeaveRequest(requestData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showSuccessToast('Leave request submitted successfully!');
          this.resetForm();
        },
        error: (error) => {
          this.isLoading = false;
          this.showErrorToast(error.error?.message || 'Failed to submit leave request');
        }
      });
    }
  }

  resetForm() {
    const currentUser = this.authService.getCurrentUser();
    this.leaveForm = {
      userId: currentUser?.id || '',
      startDate: '',
      endDate: '',
      reason: '',
      leaveType: '',
      file: ''
    };
    this.selectedFile = null;
    this.selectedFileName = '';
    this.isImagePreview = false;
    this.errors = {};
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  showSuccessToast(message: string) {
    const toastEl = document.getElementById('successToast');
    if (toastEl) {
      const messageEl = toastEl.querySelector('.toast-body');
      if (messageEl) messageEl.textContent = message;
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }

  showErrorToast(message: string) {
    const toastEl = document.getElementById('errorToast');
    if (toastEl) {
      const messageEl = toastEl.querySelector('.toast-body');
      if (messageEl) messageEl.textContent = message;
      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }

  goToHistory() {
    this.router.navigate(['/employee/view-leave']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
