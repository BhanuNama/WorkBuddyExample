import { OnInit ,Component} from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { LeaveService } from 'src/app/services/leave.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';



@Component({
  selector: 'app-leave-form',
  templateUrl: './leave-form.html',
  styleUrls: ['./leave-form.css']
})
export class LeaveFormComponent implements OnInit {
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
    private readonly leaveService: LeaveService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {
    this.leaveForm = this.fb.group({

      userId: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      reason: ['', Validators.required],
      leaveType: ['', Validators.required],
      file: ['', Validators.required]
    });
  }

  ngOnInit() {
    const navigation = window.history.state;
    if (navigation && navigation.leaveData) {
      const leaveData = navigation.leaveData;
      this.editMode = true;
      this.leaveId = leaveData._id;

      this.leaveForm.patchValue({
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

    this.leaveForm.get('startDate')?.valueChanges.subscribe(() => {
      const endDate = this.leaveForm.get('endDate')?.value;
      const startDate = this.leaveForm.get('startDate')?.value;
      if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
        this.leaveForm.patchValue({ endDate: null });
      }
    });
  }


  startDateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };
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
      // This will now catch the missing userId
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
    this.leaveForm.patchValue({userId:localStorage.getItem('id')});

    if (!this.validateForm()) {

      if (this.leaveForm.get('userId')?.invalid) {
        this.toastr.error('User ID is missing. Please wait a moment and try again.', 'Error');
      }
      return;
    }

    this.isLoading = true;
    const formValue = this.leaveForm.value;

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
      console.log(this.leaveForm.value);
      this.leaveService.updateLeaveRequest(this.leaveId, requestData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastr.success('Leave request updated successfully!');
          // setTimeout(() => {
            this.router.navigate(['/employee/view-leave']);
          // },0);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(error.error?.message ?? 'Failed to update leave request');
        }
      });
    } else {
      this.leaveService.addLeaveRequest(requestData).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Leave request submitted successfully!');
          // setTimeout(() => {
            this.router.navigate(['/employee/view-leave']);
          // }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error(error.error?.message ?? 'Failed to submit leave request');
        }
      });
    }
  }

  resetForm() {
    this.authService.id$.pipe(take(1)).subscribe((userId: string | null) => {
      this.leaveForm.reset({
        userId: userId ?? '',
        startDate: null,
        endDate: null,
        reason: '',
        leaveType: '',
        file: ''
      });
    });

    this.selectedFile = null;
    this.selectedFileName = '';
    this.isImagePreview = false;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }
}

export { LeaveFormComponent as LeaveForm };