# Leave Management Components - Code Explanation

## Table of Contents
1. [Leave Form Component](#1-leave-form-component)
2. [View Leave Component](#2-view-leave-component)
3. [Leave Requests Component](#3-leave-requests-component)

---

## 1. Leave Form Component

**File:** `src/app/components/employeeComponents/leave-form/leave-form.ts`  
**Purpose:** Allows employees to create new leave requests or edit existing pending leave requests.

---

### Imports and Dependencies

```typescript
import { OnInit ,Component} from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { LeaveService } from 'src/app/services/leave.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
```

**Explanation:**
- `OnInit, Component`: Angular lifecycle hooks and decorator
- `AuthService`: Service for authentication-related operations
- `LeaveService`: Service for leave request API calls
- `Router`: Angular router for navigation
- `FormGroup, FormBuilder, Validators`: Angular reactive forms for form handling
- `ToastrService`: Toast notification service for user feedback
- `take`: RxJS operator to take only one value from observable

---

### Component Class Declaration

```typescript
@Component({
  selector: 'app-leave-form',
  templateUrl: './leave-form.html',
  styleUrls: ['./leave-form.css']
})
export class LeaveFormComponent implements OnInit {
```

**Explanation:**
- `@Component`: Decorator that marks this class as an Angular component
- `selector: 'app-leave-form'`: HTML tag name to use this component (`<app-leave-form>`)
- `templateUrl`: Path to HTML template file
- `styleUrls`: Array of CSS files for component styling
- `implements OnInit`: Implements Angular lifecycle hook interface

---

### Component Properties

```typescript
leaveForm!: FormGroup;
selectedFile: File | null = null;
selectedFileName: string = '';
isImagePreview: boolean = false;
errors: any = {};
isLoading = false;
editMode = false;
leaveId: string | null = null;
leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Maternity Leave', 'Paternity Leave', 'Other'];
```

**Detailed Explanation:**

1. **`leaveForm!: FormGroup`**
   - The `!` (non-null assertion) tells TypeScript this will be initialized
   - Stores the reactive form containing all form controls
   - Created in constructor using FormBuilder

2. **`selectedFile: File | null = null`**
   - Stores the actual File object selected by user
   - Can be `null` if no file selected
   - Used for file operations

3. **`selectedFileName: string = ''`**
   - Stores the name of selected file for display
   - Shown in UI when file is selected

4. **`isImagePreview: boolean = false`**
   - Flag to determine if selected file is an image
   - If `true`, shows image preview in UI
   - If `false`, shows only filename

5. **`errors: any = {}`**
   - Object to store validation errors (currently not actively used)

6. **`isLoading = false`**
   - Loading state flag
   - When `true`, shows loading spinner and disables submit button
   - Prevents multiple submissions

7. **`editMode = false`**
   - Indicates if component is in edit mode
   - `true`: Editing existing leave request
   - `false`: Creating new leave request

8. **`leaveId: string | null = null`**
   - Stores ID of leave request being edited
   - Only set when in edit mode
   - Used in update API call

9. **`leaveTypes`**
   - Array of available leave types
   - Populates dropdown in form
   - Used in template with `*ngFor`

---

### Constructor

```typescript
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
```

**Explanation:**
- **Dependency Injection**: Services injected via constructor
- **`private readonly`**: Makes properties private and read-only (Angular best practice)
- **FormBuilder (`fb`)**: Creates reactive form with validation
- **Form Structure**:
  - `userId`: Hidden field, set from localStorage on submit
  - `startDate`: Date picker, required
  - `endDate`: Date picker, required
  - `reason`: Textarea, required
  - `leaveType`: Dropdown, required
  - `file`: File input, required (base64 string after conversion)

---

### ngOnInit() - Component Initialization

```typescript
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
  // ... rest of code
}
```

**Step-by-Step Explanation:**

1. **Check for Edit Mode**:
   - `window.history.state`: Gets data passed during navigation
   - If `leaveData` exists, component is in edit mode
   - Sets `editMode = true` and stores `leaveId`

2. **Populate Form**:
   - `patchValue()`: Updates form controls with existing data
   - Converts date strings to Date objects for date pickers
   - Handles null dates gracefully

3. **Handle File Attachment**:
   - If file exists, sets filename display
   - Checks if file is image by checking if it starts with `'data:image'`
   - Sets `isImagePreview` flag accordingly

**Reactive Form Listeners:**

```typescript
this.leaveForm.get('startDate')?.valueChanges.subscribe(() => {
  const endDate = this.leaveForm.get('endDate')?.value;
  const startDate = this.leaveForm.get('startDate')?.value;
  if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
    this.leaveForm.patchValue({ endDate: null });
  }
});
```

**Explanation:**
- **`valueChanges`**: Observable that emits when form control value changes
- **`?.`**: Optional chaining (safe navigation)
- **Logic**: If start date changes and end date becomes invalid (before start), reset end date
- **Purpose**: Prevents invalid date ranges

```typescript
this.leaveForm.get('leaveType')?.valueChanges.subscribe(() => {
  const startDate = this.leaveForm.get('startDate')?.value;
  if (startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedLeaveType = this.leaveForm.get('leaveType')?.value;
    const dateToCheck = new Date(startDate);
    dateToCheck.setHours(0, 0, 0, 0);
    
    if (selectedLeaveType !== 'Sick Leave' && dateToCheck.getTime() === today.getTime()) {
      this.leaveForm.patchValue({ startDate: null });
    }
  }
});
```

**Explanation:**
- **Trigger**: When leave type changes
- **Logic**: If leave type is NOT "Sick Leave" and start date is today, reset start date
- **Business Rule**: Only sick leave can be applied for today; others need advance notice
- **`setHours(0, 0, 0, 0)`**: Normalizes time to midnight for accurate date comparison

---

### startDateFilter() - Date Picker Filter

```typescript
startDateFilter = (date: Date | null): boolean => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedLeaveType = this.leaveForm.get('leaveType')?.value;
  
  // If Sick Leave is selected, allow today's date
  if (selectedLeaveType === 'Sick Leave') {
    return date >= today;
  }
  
  // For all other leave types, disable today's date (only allow future dates)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date >= tomorrow;
};
```

**Explanation:**
- **Arrow Function**: Used as callback for Angular Material date picker
- **Parameter**: `date` - Date being evaluated by date picker
- **Return**: `true` if date should be selectable, `false` if disabled
- **Logic Flow**:
  1. Returns `false` if date is null
  2. Gets today's date and normalizes to midnight
  3. Gets selected leave type from form
  4. **Sick Leave**: Allows today and all future dates (`date >= today`)
  5. **Other Types**: Calculates tomorrow, only allows tomorrow onwards (`date >= tomorrow`)

**Why This Approach:**
- Prevents users from selecting invalid dates
- Enforces business rules at UI level
- Provides immediate feedback

---

### endDateFilter() - End Date Validation

```typescript
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
```

**Explanation:**
- **Purpose**: Ensures end date is not before start date
- **Logic**:
  1. If no start date selected, uses same rules as start date filter
  2. If start date exists, end date must be >= start date
  3. Normalizes times to midnight for accurate comparison

---

### onFileSelected() - File Upload Handler

```typescript
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
```

**Step-by-Step Explanation:**

1. **Extract File**:
   - `event.target.files[0]`: Gets first file from file input
   - File input allows multiple files, but we only use first one

2. **Store File Info**:
   - `this.selectedFile = file`: Stores File object
   - `this.selectedFileName = file.name`: Stores filename for display

3. **Check if Image**:
   - Calls `isImageFile()` to determine file type
   - Sets `isImagePreview` flag

4. **Convert to Base64**:
   - `FileReader`: Browser API for reading files
   - `readAsDataURL()`: Converts file to base64 data URL string
   - `onload`: Callback when file reading completes
   - `reader.result`: Contains base64 string (e.g., `"data:image/png;base64,..."`)
   - Updates form control with base64 string

**Why Base64:**
- Can be stored as string in database
- No need for separate file storage system
- Easy to send via JSON API

---

### isImageFile() - Image Type Check

```typescript
isImageFile(file: File | null): boolean {
  if (!file) return false;
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return imageTypes.includes(file.type);
}
```

**Explanation:**
- **Purpose**: Determines if file is an image for preview purposes
- **MIME Types**: Checks file's `type` property against known image MIME types
- **Return**: `true` if image, `false` otherwise
- **Usage**: Controls whether to show image preview or just filename

---

### validateForm() - Form Validation

```typescript
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
```

**Explanation:**

1. **Form State Check**:
   - `this.leaveForm.invalid`: Checks if any form control has validation errors
   - `markAllAsTouched()`: Marks all controls as touched to show validation errors
   - Returns `false` if form is invalid

2. **Date Range Validation**:
   - Gets start and end dates from form
   - If both exist, compares them
   - If end date is before start date:
     - Sets custom error `invalidEndDate` on end date control
     - Returns `false`

3. **Success**: Returns `true` if all validations pass

**Why Custom Validation:**
- Angular validators handle required fields
- Date range logic requires custom validation
- Provides specific error message for date range issues

---

### onSubmit() - Form Submission

```typescript
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
    // Update existing request
    this.leaveService.updateLeaveRequest(this.leaveId, requestData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastr.success('Leave request updated successfully!');
        this.router.navigate(['/employee/view-leave']);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(error.error?.message ?? 'Failed to update leave request');
      }
    });
  } else {
    // Create new request
    this.leaveService.addLeaveRequest(requestData).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Leave request submitted successfully!');
        this.router.navigate(['/employee/view-leave']);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(error.error?.message ?? 'Failed to submit leave request');
      }
    });
  }
}
```

**Detailed Step-by-Step:**

1. **Set User ID**:
   - Gets user ID from localStorage
   - Patches form (not visible in UI, but required for backend)

2. **Validate Form**:
   - Calls `validateForm()`
   - If invalid, shows error and returns early

3. **Set Loading State**:
   - `isLoading = true`: Shows loading spinner, disables button

4. **Date Formatting Function**:
   - **Internal Function**: `formatDate()` defined inside `onSubmit()`
   - **Purpose**: Converts dates to ISO string format
   - **Logic**:
     - Returns empty string if date is null
     - Converts to Date object if string
     - Checks if date is valid (`isNaN()` check)
     - Normalizes time to midnight
     - Converts to ISO string

5. **Prepare Request Data**:
   - Spreads all form values: `...formValue`
   - Formats dates using `formatDate()` function
   - Creates `requestData` object for API

6. **Edit Mode Branch**:
   - If `editMode` is true and `leaveId` exists:
     - Calls `updateLeaveRequest()` API
     - **Success**: Shows success toast, navigates to view-leave
     - **Error**: Shows error toast with error message

7. **Create Mode Branch**:
   - If not in edit mode:
     - Calls `addLeaveRequest()` API
     - **Success**: Shows success toast, navigates to view-leave
     - **Error**: Shows error toast with error message

8. **Loading State Reset**:
   - Sets `isLoading = false` in both success and error cases

**Observable Pattern:**
- `subscribe()`: Subscribes to API observable
- `next`: Success callback
- `error`: Error callback
- `??`: Nullish coalescing operator (uses default if error message is null/undefined)

---

### resetForm() - Form Reset

```typescript
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
```

**Explanation:**

1. **Get User ID from Observable**:
   - `authService.id$`: Observable that emits user ID
   - `pipe(take(1))`: Takes only first value, then unsubscribes
   - Gets latest user ID or uses empty string

2. **Reset Form**:
   - `reset()`: Resets form to initial values
   - Provides default values for all controls

3. **Reset File State**:
   - Clears `selectedFile`, `selectedFileName`, `isImagePreview`

4. **Reset File Input Element**:
   - Gets file input element by ID
   - Resets its value to empty string (clears selected file in UI)

**Why Observable:**
- Ensures latest user ID is used
- Handles cases where user ID might change during session

---

## 2. View Leave Component

**File:** `src/app/components/employeeComponents/view-leave/view-leave.ts`  
**Purpose:** Displays all leave requests for the logged-in employee with search, sort, and pagination.

---

### Component Properties

```typescript
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
```

**Explanation:**

- **`leaveRequests`**: Legacy property, not actively used
- **`filteredRequests`**: Array displayed in table (after filtering/pagination)
- **`allRequests`**: Complete array from API (before filtering)
- **`isLoading`**: Loading state for API calls
- **`searchValue`**: Search term for filtering
- **`currentUserId`**: Logged-in user's ID
- **`currentUserName`**: Logged-in user's name
- **`selectedLeave`**: Currently selected leave (not actively used)
- **`deleteLeaveId`**: ID of leave to delete (stored when delete modal opens)
- **`sortOrder`**: Sort direction ('asc' or 'desc')
- **`page`**: Current page number (1-indexed)
- **`pageSize`**: Items per page (fixed at 5)
- **`total`**: Total number of filtered items
- **`totalPages`**: Total number of pages

---

### ngOnInit() - Initialization

```typescript
ngOnInit() {
  this.currentUserId = localStorage.getItem('id') || '';
  this.currentUserName = localStorage.getItem('userName') || '';

  if (this.currentUserId) {
    this.loadLeaveRequests();
  } else {
    this.router.navigate(['/login']);
  }
}
```

**Explanation:**
- Gets user ID and name from localStorage
- If user ID exists, loads leave requests
- If not, redirects to login (security check)

---

### loadLeaveRequests() - Fetch Data

```typescript
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
```

**Explanation:**
- Sets loading state
- Calls API to get user's leave requests
- **Success**: Stores data, calculates totals, applies filters
- **Error**: Shows error toast

---

### applyFiltersAndPagination() - Data Processing

```typescript
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
```

**Step-by-Step:**

1. **Create Copy**:
   - `[...this.allRequests]`: Spread operator creates shallow copy
   - Prevents mutating original array

2. **Search Filter**:
   - If search value exists (after trim):
     - Filters array using `filter()` method
     - Searches in `reason` field (case-insensitive)
     - Uses `includes()` for partial matching

3. **Sorting**:
   - Sorts by `createdOn` date
   - Converts dates to timestamps for comparison
   - **Ascending**: `dateA - dateB` (oldest first)
   - **Descending**: `dateB - dateA` (newest first)

4. **Pagination**:
   - Calculates start index: `(page - 1) * pageSize`
   - Calculates end index: `start + pageSize`
   - Uses `slice()` to extract current page
   - Updates totals based on filtered length

**Why Client-Side:**
- Instant filtering without API calls
- Better user experience
- May have performance issues with very large datasets

---

### onSearch() - Search Handler

```typescript
onSearch() {
  this.page = 1;
  this.applyFiltersAndPagination();
}
```

**Explanation:**
- Resets to page 1 when searching
- Applies filters and pagination

---

### toggleSort() - Sort Toggle

```typescript
toggleSort() {
  this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  this.applyFiltersAndPagination();
}
```

**Explanation:**
- Toggles between ascending and descending
- Re-applies filters

---

### previousPage() / nextPage() - Pagination

```typescript
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
```

**Explanation:**
- **Previous**: Decrements page if not on page 1
- **Next**: Increments page if not on last page
- Both re-apply filters after page change

---

### formatDate() - Date Formatting

```typescript
formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB');
}
```

**Explanation:**
- Converts date to British format (DD/MM/YYYY)
- Handles both string and Date object inputs

---

### getStatusBadgeClass() - Status Styling

```typescript
getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Approved': return 'bg-success';
    case 'Rejected': return 'bg-danger';
    case 'Pending': return 'bg-warning text-dark';
    default: return 'bg-secondary';
  }
}
```

**Explanation:**
- Returns Bootstrap CSS class based on status
- Used with `[ngClass]` directive in template

---

### canEdit() - Permission Check

```typescript
canEdit(status: string): boolean {
  return status === 'Pending';
}
```

**Explanation:**
- Only pending requests can be edited/deleted
- Used to disable buttons for approved/rejected requests

---

### editLeave() - Edit Navigation

```typescript
editLeave(leave: LeaveRequest) {
  if (!this.canEdit(leave.status)) return;
  this.router.navigate(['/employee/leave-form'], { state: { leaveData: leave } });
}
```

**Explanation:**
- Checks if editable
- Navigates to leave form with leave data in state
- Leave form reads state to enter edit mode

---

### openDeleteModal() - Delete Confirmation

```typescript
openDeleteModal(leaveId: string) {
  this.deleteLeaveId = leaveId;
  const modalEl = document.getElementById('deleteModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}
```

**Explanation:**
- Stores leave ID for deletion
- Gets modal element
- Creates Bootstrap modal instance and shows it

---

### confirmDelete() - Delete Action

```typescript
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
```

**Explanation:**
- Validates delete ID exists
- Calls delete API
- **Success**: Shows toast, refreshes list, closes modal
- **Error**: Shows error toast

---

### closeDeleteModal() - Modal Cleanup

```typescript
closeDeleteModal() {
  const modalEl = document.getElementById('deleteModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) {
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement && modalEl.contains(focusedElement)) {
        focusedElement.blur();
      }
      modal.hide();
    }
  }
  this.deleteLeaveId = '';
}
```

**Explanation:**
- Gets existing modal instance
- Removes focus from focused element (accessibility)
- Hides modal
- Clears delete ID

---

## 3. Leave Requests Component

**File:** `src/app/components/managerComponents/leave-requests/leave-requests.ts`  
**Purpose:** Manager dashboard to view, search, filter, sort, and approve/reject all employee leave requests.

---

### Component Properties

```typescript
leaveRequests: any[] = [];
filteredRequests: any[] = [];
isLoading = false;
searchValue = '';
statusFilter = '';
page = 1;
pageSize = 5;
total = 0;
totalPages = 0;
selectedLeaveDetails: any = null;
selectedEmployee: any = null;
imageError = false;
sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';
```

**Explanation:**

- **`leaveRequests`**: All requests from API
- **`filteredRequests`**: Requests after sorting (displayed in table)
- **`isLoading`**: Loading state
- **`searchValue`**: Search term
- **`statusFilter`**: Status filter (Pending/Approved/Rejected)
- **`page`, `pageSize`, `total`, `totalPages`**: Pagination properties
- **`selectedLeaveDetails`**: Leave request selected for details modal
- **`selectedEmployee`**: Employee info for selected leave
- **`imageError`**: Flag for image loading errors
- **`sortColumn`**: Currently sorted column name
- **`sortDirection`**: Sort direction

---

### loadLeaveRequests() - Fetch with Server-Side Filtering

```typescript
loadLeaveRequests() {
  this.isLoading = true;
  const params = {
    page: this.page,
    pageSize: this.pageSize,
    searchValue: this.searchValue,
    statusFilter: this.statusFilter
  };

  this.leaveService.getAllLeaveRequests(params).subscribe({
    next: (response) => {
      this.leaveRequests = response.data;
      this.filteredRequests = [...response.data];
      this.total = response.total;
      this.totalPages = Math.ceil(this.total / this.pageSize);
      this.isLoading = false;
      if (this.sortColumn) {
        this.applyFrontendSort();
      }
    },
    error: (error) => {
      this.isLoading = false;
      this.toastr.error('Failed to Load Leave Requests');
    }
  });
}
```

**Explanation:**
- **Server-Side Filtering**: Sends search and status filter to API
- **Params Object**: Contains pagination and filter parameters
- **Response Handling**:
  - Stores data in `leaveRequests`
  - Creates copy for `filteredRequests`
  - Gets total from API response (not calculated client-side)
  - Applies frontend sorting if active

**Why Server-Side:**
- Better performance with large datasets
- Reduces data transfer
- Server handles filtering logic

---

### onSearch() / onStatusFilterChange() - Filter Handlers

```typescript
onSearch() {
  this.page = 1;
  this.loadLeaveRequests();
}

onStatusFilterChange() {
  this.page = 1;
  this.loadLeaveRequests();
}
```

**Explanation:**
- Both reset to page 1
- Both trigger API call with new filters
- Server-side filtering (unlike view-leave component)

---

### sortByColumn() - Column Sorting

```typescript
sortByColumn(column: string) {
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  this.applyFrontendSort();
}
```

**Explanation:**
- **Same Column**: Toggles sort direction
- **New Column**: Sets column and defaults to ascending
- Applies frontend sort (client-side)

**Why Frontend Sort:**
- Already have data from API
- Instant sorting without API call
- Better user experience

---

### applyFrontendSort() - Sorting Logic

```typescript
applyFrontendSort() {
  if (!this.sortColumn) return;

  this.filteredRequests.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (this.sortColumn) {
      case 'employeeName':
        aValue = this.getUserName(a.userId) || '';
        bValue = this.getUserName(b.userId) || '';
        break;
      case 'startDate':
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
        break;
      case 'endDate':
        aValue = new Date(a.endDate).getTime();
        bValue = new Date(b.endDate).getTime();
        break;
      case 'createdOn':
        aValue = new Date(a.createdOn).getTime();
        bValue = new Date(b.createdOn).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}
```

**Explanation:**
- **Early Return**: If no sort column, exit
- **Switch Statement**: Gets values based on column type
  - **employeeName**: Gets user name from userId object
  - **Dates**: Converts to timestamps for comparison
- **Comparison Logic**:
  - If `aValue < bValue`: Returns -1 for asc, 1 for desc
  - If `aValue > bValue`: Returns 1 for asc, -1 for desc
  - If equal: Returns 0

**Sort Return Values:**
- Negative: `a` comes before `b`
- Positive: `a` comes after `b`
- Zero: Equal (no change)

---

### getSortIcon() / isColumnActive() - UI Helpers

```typescript
getSortIcon(column: string): string {
  if (this.sortColumn !== column) {
    return '';
  }
  return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
}

isColumnActive(column: string): boolean {
  return this.sortColumn === column;
}
```

**Explanation:**
- **getSortIcon**: Returns Bootstrap icon class for active column
- **isColumnActive**: Checks if column is currently sorted
- Used in template for visual feedback

---

### getUserName() - Extract Employee Name

```typescript
getUserName(userId: any): string {
  if (userId && typeof userId === 'object' && userId.userName) {
    return userId.userName;
  }
  return '';
}
```

**Explanation:**
- **Populated Object**: If userId is populated (object with userName), returns name
- **Not Populated**: Returns empty string
- Handles both populated and unpopulated userId from API

---

### showMore() - Details Modal

```typescript
showMore(leave: any) {
  this.selectedLeaveDetails = leave;
  this.imageError = false;

  if (leave.userId && typeof leave.userId === 'object' && leave.userId.userName) {
    this.selectedEmployee = leave.userId;
  } else {
    this.selectedEmployee = null;
  }

  const modalEl = document.getElementById('detailsModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}
```

**Explanation:**
- Stores leave details and employee info
- Resets image error flag
- Extracts employee data from populated userId
- Opens Bootstrap modal

---

### onImageError() - Image Error Handler

```typescript
onImageError() {
  this.imageError = true;
}
```

**Explanation:**
- Called when image fails to load
- Sets flag to show error message instead of broken image

---

### closeDetailsModal() - Modal Cleanup

```typescript
closeDetailsModal() {
  const modalEl = document.getElementById('detailsModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }

  this.selectedLeaveDetails = null;
  this.selectedEmployee = null;
}
```

**Explanation:**
- Gets modal instance and hides it
- Clears selected data

---

### updateStatus() - Status Update

```typescript
updateStatus(leaveId: string, status: string) {
  this.leaveService.updateLeaveRequest(leaveId, { status }).subscribe({
    next: () => {
      this.toastr.success(`Leave request ${status.toLowerCase()} successfully`)
      this.loadLeaveRequests();
    },
    error: () => {
      this.toastr.error(`Failed to ${status.toLowerCase()} leave request`);
    }
  });
}
```

**Explanation:**
- Updates leave request status via API
- **Success**: Shows success toast, refreshes list
- **Error**: Shows error toast
- Used by `approveLeve()` and `rejectLeave()`

---

### approveLeve() / rejectLeave() - Action Wrappers

```typescript
approveLeve(leaveId: string) {
  this.updateStatus(leaveId, 'Approved');
}

rejectLeave(leaveId: string) {
  this.updateStatus(leaveId, 'Rejected');
}
```

**Explanation:**
- Wrapper functions for approve/reject actions
- Both call `updateStatus()` with appropriate status
- Note: `approveLeve` has typo (should be `approveLeave`)

---

### previousPage() / nextPage() - Pagination

```typescript
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
```

**Explanation:**
- Similar to view-leave component
- But calls `loadLeaveRequests()` (server-side) instead of `applyFiltersAndPagination()` (client-side)

---

## Key Differences Between Components

### Leave Form vs View Leave vs Leave Requests

| Feature | Leave Form | View Leave | Leave Requests |
|---------|-----------|-------------|----------------|
| **User Type** | Employee | Employee | Manager |
| **Purpose** | Create/Edit | View Own | View All |
| **Filtering** | N/A | Client-side | Server-side |
| **Sorting** | N/A | Client-side | Frontend (after fetch) |
| **Pagination** | N/A | Client-side | Server-side |
| **Actions** | Submit/Update | Edit/Delete | Approve/Reject |
| **Data Source** | Form Input | User's requests | All requests |

---

## Common Patterns

### 1. Observable Pattern
All components use RxJS observables for API calls:
```typescript
service.method().subscribe({
  next: (data) => { /* success */ },
  error: (error) => { /* error */ }
});
```

### 2. Loading States
All components use `isLoading` flag:
- Set to `true` before API call
- Set to `false` in both success and error handlers

### 3. Toast Notifications
All components use ToastrService for user feedback:
- Success: Green toast
- Error: Red toast

### 4. Navigation
Components use Angular Router for navigation:
- `router.navigate(['/route'])` - Basic navigation
- `router.navigate(['/route'], { state: { data } })` - With data

### 5. Form Validation
Leave form uses reactive forms with validators:
- `Validators.required` - Required fields
- Custom validation - Date range checks

---

## Best Practices Used

1. **Type Safety**: Uses TypeScript types and interfaces
2. **Error Handling**: Try-catch via observable error handlers
3. **Loading States**: Prevents multiple submissions
4. **User Feedback**: Toast notifications for all actions
5. **Security**: Checks user authentication before loading data
6. **Accessibility**: Focus management in modals
7. **Code Reusability**: Helper functions for common operations

---

## Summary

These three components work together to provide a complete leave management system:

1. **Leave Form**: Employees create/edit leave requests
2. **View Leave**: Employees view and manage their own requests
3. **Leave Requests**: Managers review and approve/reject all requests

Each component handles its specific responsibilities while maintaining consistent patterns for error handling, loading states, and user feedback.

