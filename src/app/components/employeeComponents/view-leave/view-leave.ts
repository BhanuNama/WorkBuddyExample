import { OnInit,Component } from '@angular/core';
import { Router } from '@angular/router';
import { LeaveRequest } from '../../../models/leave-request.model';
import { LeaveService } from 'src/app/services/leave.service';
import { ToastrService } from 'ngx-toastr';

declare let bootstrap: any;

@Component({
  selector: 'app-view-leave',
  templateUrl: './view-leave.html',
  styleUrls: ['./view-leave.css']
})

export class ViewLeaveComponent implements OnInit {
  leaveRequests: LeaveRequest[] = [];
  filteredRequests: LeaveRequest[] = [];
  allRequests: LeaveRequest[] = [];
  isLoading = false;
  searchValue = '';
  currentUserId = '';
  currentUserName = '';
  selectedLeave: LeaveRequest | null = null;
  deleteLeaveId: string = '';
  sortOrder: 'asc' | 'desc' = 'desc';
  page = 1;
  pageSize = 5;
  total = 0;
  totalPages = 0;

  constructor(
    private readonly leaveService: LeaveService,
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) { }

  ngOnInit() {
    this.currentUserId = localStorage.getItem('id') || '';
    this.currentUserName = localStorage.getItem('userName') || '';

    if (this.currentUserId) {
      this.loadLeaveRequests();
    } else {
      this.router.navigate(['/login']);
    }
  }


  loadLeaveRequests() {
    this.isLoading = true;
    this.leaveService.getLeaveRequestsByUserId(this.currentUserId).subscribe({
      next: (data) => {
        this.allRequests = data;
        this.total = data.length;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;

        this.toastr.error('Failed to Load Leave Requests ');
      }
    });
  }

  applyFiltersAndPagination() {
    let filtered = [...this.allRequests];

    // Apply search
    if (this.searchValue.trim()) {
      filtered = filtered.filter(leave =>
        leave.reason.toLowerCase().includes(this.searchValue.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdOn).getTime();
      const dateB = new Date(b.createdOn).getTime();
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Apply pagination
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredRequests = filtered.slice(start, end);
    this.total = filtered.length;
    this.totalPages = Math.ceil(this.total / this.pageSize);
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

  getUserName(): string {
    return this.currentUserName;
  }

  closeDeleteModal() {
    const modalEl = document.getElementById('deleteModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) {
        // Remove focus from any focused element before hiding
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement && modalEl.contains(focusedElement)) {
          focusedElement.blur();
        }
        modal.hide();
      }
    }
    this.deleteLeaveId = '';
  }

  goToApplyLeave() {
    this.router.navigate(['/employee/leave-form']);
  }

  logout() {

    this.router.navigate(['/login']);
  }

}

export { ViewLeaveComponent as ViewLeave };