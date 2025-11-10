export interface User {
  _id?: string;
  userName: string;
  email: string;
  mobile: string;
  password?: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userName: string;
  role: string;
  token: string;
  id: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
}

