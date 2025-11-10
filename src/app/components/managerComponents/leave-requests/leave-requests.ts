import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { LeaveRequest } from '../../../models/leave-request.model';

declare var bootstrap: any;
declare var window: any;

@Component({
  selector: 'app-leave-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-requests.html',
  styleUrl: './leave-requests.css',
})
export class LeaveRequests implements OnInit {
  leaveRequests: any[] = [];
  filteredRequests: any[] = [];
  employees: any[] = [];
  isLoading = false;
  searchValue = '';
  statusFilter = '';
  sortValue = 'desc';
  page = 1;
  pageSize = 5;
  total = 0;
  totalPages = 0;
  
  selectedLeaveDetails: any = null;
  selectedEmployee: any = null;
  imageError = false;

  constructor(
    private leaveService: LeaveService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEmployees();
    this.loadLeaveRequests();
  }

  loadEmployees() {
    this.userService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        this.employees = [];
      }
    });
  }

  getEmployeeById(userId: string): any {
    if (!userId || !this.employees || this.employees.length === 0) return null;
    return this.employees.find(emp => {
      const empId = emp._id ? String(emp._id) : '';
      const reqUserId = String(userId);
      return empId === reqUserId;
    });
  }

  loadLeaveRequests() {
    this.isLoading = true;
    const params = {
      page: this.page,
      pageSize: this.pageSize,
      searchValue: this.searchValue,
      sortValue: this.sortValue,
      statusFilter: this.statusFilter,
      sortBy: 'createdOn'
    };

    this.leaveService.getAllLeaveRequests(params).subscribe({
      next: (response) => {
        this.leaveRequests = response.data;
        this.filteredRequests = response.data;
        this.total = response.total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.showErrorToast('Failed to load leave requests');
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadLeaveRequests();
  }

  onStatusFilterChange() {
    this.page = 1;
    this.loadLeaveRequests();
  }

  toggleSort() {
    this.sortValue = this.sortValue === 'asc' ? 'desc' : 'asc';
    this.loadLeaveRequests();
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-GB');
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      case 'Pending': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  getUserName(userId: any): string {
    // Check if userId is populated (object with userName) or just an ID
    if (userId && typeof userId === 'object' && userId.userName) {
      return userId.userName;
    }
    // Fallback to employee lookup if not populated
    if (!userId || !this.employees || this.employees.length === 0) return '';
    const user = this.employees.find(emp => String(emp._id) === String(userId));
    return user ? user.userName : '';
  }

  showMore(leave: any) {
    this.selectedLeaveDetails = leave;
    this.imageError = false;
    // Check if userId is populated (object) or just an ID
    if (leave.userId && typeof leave.userId === 'object' && leave.userId.userName) {
      // Use populated user data directly
      this.selectedEmployee = leave.userId;
    } else {
      // Fallback to employee lookup
      this.selectedEmployee = this.getEmployeeById(leave.userId);
    }
    
    const modalEl = document.getElementById('detailsModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  onImageError() {
    this.imageError = true;
  }


  closeDetailsModal() {
    const modalEl = document.getElementById('detailsModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
    this.selectedLeaveDetails = null;
    this.selectedEmployee = null;
  }

  updateStatus(leaveId: string, status: string) {
    this.leaveService.updateLeaveRequest(leaveId, { status }).subscribe({
      next: (response) => {
        this.showSuccessToast(`Leave request ${status.toLowerCase()} successfully`);
        this.loadLeaveRequests();
      },
      error: (error) => {
        this.showErrorToast(`Failed to ${status.toLowerCase()} leave request`);
      }
    });
  }

  approveLeve(leaveId: string) {
    this.updateStatus(leaveId, 'Approved');
  }

  rejectLeave(leaveId: string) {
    this.updateStatus(leaveId, 'Rejected');
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.loadLeaveRequests();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadLeaveRequests();
    }
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
