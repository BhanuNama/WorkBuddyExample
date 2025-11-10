export interface LeaveRequest {
  _id?: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdOn: Date | string;
  file: string;
}

export interface LeaveRequestResponse {
  data: LeaveRequest[];
  total: number;
}

export interface LeaveRequestWithUser extends LeaveRequest {
  userName?: string;
  email?: string;
  mobile?: string;
}

