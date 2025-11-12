import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { LeaveRequest } from '../../../models/leave-request.model';
import { ToastrService } from 'ngx-toastr';

declare var bootstrap: any;
declare var window: any;

@Component({
  selector: 'app-leave-requests',
  templateUrl: './leave-requests.html',
  styleUrls: ['./leave-requests.css'],
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
    private router: Router,
    private toastr: ToastrService
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
    if (!userId || !this.employees?.length) return null;
    return this.employees.find(emp => String(emp._id) === String(userId)) || null;
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
        this.toastr.error('Failed to load leave requests');
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
    if (userId && typeof userId === 'object' && userId.userName) {
      return userId.userName;
    }
    if (!userId || !this.employees?.length) return '';
    const user = this.employees.find(emp => String(emp._id) === String(userId));
    return user?.userName || '';
  }

  showMore(leave: any) {
    this.selectedLeaveDetails = leave;
    this.imageError = false;
    
    if (leave.userId && typeof leave.userId === 'object' && leave.userId.userName) {
      this.selectedEmployee = leave.userId;
    } else {
      this.selectedEmployee = this.getEmployeeById(leave.userId);
    }
    
    const modalEl = document.getElementById('detailsModal');
    if (modalEl) {
      new bootstrap.Modal(modalEl).show();
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
      next: () => {
        this.toastr.success(`Leave request ${status.toLowerCase()} successfully`);
        this.loadLeaveRequests();
      },
      error: () => {
        this.toastr.error(`Failed to ${status.toLowerCase()} leave request`);
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
