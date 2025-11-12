import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { AuthService } from '../../../services/auth.service';
import { LeaveRequest } from '../../../models/leave-request.model';
import { ToastrService } from 'ngx-toastr';

declare var bootstrap: any;

@Component({
  selector: 'app-view-leave',
  templateUrl: './view-leave.html',
  styleUrls: ['./view-leave.css'],
})
export class ViewLeave implements OnInit {
  filteredRequests: LeaveRequest[] = [];
  allRequests: LeaveRequest[] = [];
  isLoading = false;
  searchValue = '';
  currentUserId = '';
  deleteLeaveId = '';
  sortOrder: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 5;
  totalPages = 0;

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.loadLeaveRequests();
    }
  }

  loadLeaveRequests() {
    this.isLoading = true;
    this.leaveService.getLeaveRequestsByUserId(this.currentUserId).subscribe({
      next: (data) => {
        this.allRequests = data;
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Failed to load leave requests');
      }
    });
  }

  applyFiltersAndPagination() {
    let filtered = [...this.allRequests];

    if (this.searchValue.trim()) {
      const search = this.searchValue.toLowerCase();
      filtered = filtered.filter(leave => leave.reason.toLowerCase().includes(search));
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdOn).getTime();
      const dateB = new Date(b.createdOn).getTime();
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const start = (this.page - 1) * this.pageSize;
    this.filteredRequests = filtered.slice(start, start + this.pageSize);
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
  }

  onSearch() {
    this.page = 1;
    this.applyFiltersAndPagination();
  }

  toggleSort() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFiltersAndPagination();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.applyFiltersAndPagination();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.applyFiltersAndPagination();
    }
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

  canEdit(status: string): boolean {
    return status === 'Pending';
  }

  editLeave(leave: LeaveRequest) {
    if (!this.canEdit(leave.status)) return;
    this.router.navigate(['/employee/leave-form'], { state: { leaveData: leave } });
  }

  openDeleteModal(leaveId: string) {
    this.deleteLeaveId = leaveId;
    const modalEl = document.getElementById('deleteModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  confirmDelete() {
    if (!this.deleteLeaveId) return;

    this.leaveService.deleteLeaveRequest(this.deleteLeaveId).subscribe({
      next: () => {
        this.toastr.success('Leave request deleted successfully');
        this.loadLeaveRequests();
        this.closeDeleteModal();
      },
      error: () => {
        this.toastr.error('Failed to delete leave request');
      }
    });
  }

  closeDeleteModal() {
    const modalEl = document.getElementById('deleteModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
    this.deleteLeaveId = '';
  }

  goToApplyLeave() {
    this.router.navigate(['/employee/leave-form']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
