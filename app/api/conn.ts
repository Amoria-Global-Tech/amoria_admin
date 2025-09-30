// API Service matching backend auth routes with token refresh middleware

export interface APIConfig {
  method?: string;
  headers?: Record<string, any>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  skipRetry?: boolean;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
}

export interface BackendResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

// ============ AUTH INTERFACES ============

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType?: string;
}

export interface GoogleAuthData {
  token: string;
  userType?: string;
}

export interface AppleAuthData {
  token: string;
  userType?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  userType: string;
  name?: string;
  provider?: string;
  isActive?: boolean;
  isVerified?: boolean;
  employmentType?: string;
  documentUrls?: Record<string, string>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PasswordResetData {
  email: string;
}

export interface OTPVerificationData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SetupPasswordData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface KYCData {
  documentType: string;
  documentNumber: string;
  documentImage: File;
  selfie: File;
}

export interface UserSession {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  loginTime: string;
  isActive: boolean;
}

class APIService {
  private baseURL: string;
  private defaultHeaders: Record<string, string> = {
    'Accept': 'application/json'
  };
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    config: any;
  }> = [];

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_ENDPOINT_URL || 'http://localhost:5000/api';
  }

  // ============ AUTH TOKEN MANAGEMENT ============

  setAuth(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
  }

  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.defaultHeaders, headers);
  }

  private clearAuthData(): void {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authOTP');
    localStorage.removeItem('otpTimestamp');
    this.clearAuth();
  }

  private redirectToLogin(): void {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = '/auth';
    }
  }

  // ============ REQUEST UTILITIES ============

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const baseURL = this.baseURL.endsWith('/') ? this.baseURL : this.baseURL + '/';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    const url = new URL(cleanEndpoint, baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null) url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }

  private prepareBody(body: any): any {
    if (!body) return null;
    
    if (body instanceof FormData || body instanceof File || body instanceof Blob || 
        body instanceof ArrayBuffer || body instanceof URLSearchParams || 
        typeof body === 'string') {
      return body;
    }

    if (this.hasFiles(body)) {
      const formData = new FormData();
      this.buildFormData(formData, body);
      return formData;
    }

    return JSON.stringify(body);
  }

  private hasFiles(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    const checkValue = (val: any): boolean => {
      if (val instanceof File || val instanceof Blob) return true;
      if (Array.isArray(val)) return val.some(checkValue);
      if (val && typeof val === 'object') return Object.values(val).some(checkValue);
      return false;
    };
    
    return Object.values(obj).some(checkValue);
  }

  private buildFormData(formData: FormData, obj: any, prefix = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldName = prefix ? `${prefix}[${key}]` : key;
      
      if (value instanceof File || value instanceof Blob) {
        formData.append(fieldName, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayFieldName = `${fieldName}[${index}]`;
          if (item instanceof File || item instanceof Blob) {
            formData.append(arrayFieldName, item);
          } else if (item && typeof item === 'object') {
            this.buildFormData(formData, item, arrayFieldName);
          } else {
            formData.append(arrayFieldName, String(item));
          }
        });
      } else if (value && typeof value === 'object') {
        this.buildFormData(formData, value, fieldName);
      } else if (value != null) {
        formData.append(fieldName, String(value));
      }
    });
  }

  // ============ TOKEN REFRESH MIDDLEWARE ============

  private processFailedQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        resolve(this.executeRequest(config));
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshAuthToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.executeRequest({
        endpoint: '/auth/refresh-token',
        method: 'POST',
        body: { refreshToken },
        skipRetry: true
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const result: BackendResponse<RefreshTokenResponse> = response.data;
      
      if (!result.success || !result.data?.accessToken) {
        throw new Error('Invalid refresh response');
      }

      localStorage.setItem('authToken', result.data.accessToken);
      if (result.data.refreshToken) {
        localStorage.setItem('refreshToken', result.data.refreshToken);
      }

      this.setAuth(result.data.accessToken);
      return result.data.accessToken;

    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // ============ CORE REQUEST METHOD ============

  private async executeRequest(config: any): Promise<APIResponse<any>> {
    const { endpoint, method = 'GET', headers = {}, body, params, timeout = 50000 } = config;
    
    const url = this.buildURL(endpoint, params);
    const mergedHeaders = { ...this.defaultHeaders, ...headers };
    const preparedBody = this.prepareBody(body);
    
    if (preparedBody instanceof FormData) {
      delete mergedHeaders['Content-Type'];
    } else if (preparedBody && typeof preparedBody === 'string') {
      mergedHeaders['Content-Type'] = 'application/json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: mergedHeaders,
        body: preparedBody,
        signal: controller.signal,
        credentials: 'include',
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      let data: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('json')) {
        data = await response.json();
      } else if (contentType.includes('text')) {
        data = await response.text();
      } else if (contentType.includes('blob') || contentType.includes('octet-stream')) {
        data = await response.blob();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        throw {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data,
          response
        };
      }

      return { data, status: response.status, ok: response.ok };
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  async request<T = any>(endpoint: string, config: APIConfig = {}): Promise<APIResponse<T>> {
    const { skipRetry = false } = config;
    let retryCount = 0;
    const maxRetries = 5;

    const makeRequest = async (): Promise<APIResponse<T>> => {
      try {
        return await this.executeRequest({ endpoint, ...config });
      } catch (error: any) {
        if (error.status === 401 && !skipRetry && retryCount < maxRetries) {
          retryCount++;
          
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({
                resolve,
                reject,
                config: { endpoint, ...config }
              });
            });
          }

          try {
            this.isRefreshing = true;
            const newToken = await this.refreshAuthToken();
            this.processFailedQueue(null, newToken);
            
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                'Authorization': `Bearer ${newToken}`
              }
            };
            
            return await this.executeRequest({ endpoint, ...retryConfig });
            
          } catch (refreshError) {
            console.error(`Token refresh attempt ${retryCount} failed:`, refreshError);
            this.processFailedQueue(refreshError);
            
            if (retryCount >= maxRetries) {
              console.error('Max retry attempts reached. Clearing auth data.');
              this.clearAuthData();
              this.redirectToLogin();
              throw new Error('Authentication failed after maximum retry attempts');
            }
            
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            return makeRequest();
            
          } finally {
            this.isRefreshing = false;
          }
        }
        
        throw error;
      }
    };

    return makeRequest();
  }

  // ============ HTTP METHOD SHORTCUTS ============

  get<T = any>(url: string, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T = any>(url: string, body?: any, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  put<T = any>(url: string, body?: any, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  patch<T = any>(url: string, body?: any, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', body });
  }

  delete<T = any>(url: string, config?: Omit<APIConfig, 'method' | 'body'>): Promise<APIResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  // ============ PUBLIC AUTHENTICATION METHODS ============

  /**
   * User registration
   */
  async register(userData: RegisterData): Promise<APIResponse<BackendResponse<AuthResponse>>> {
    return this.post<BackendResponse<AuthResponse>>('/auth/register', userData, { skipRetry: true });
  }

  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<APIResponse<BackendResponse<AuthResponse>>> {
    return this.post<BackendResponse<AuthResponse>>('/auth/login', credentials, { skipRetry: true });
  }

  /**
   * Google OAuth authentication
   */
  async googleAuth(authData: GoogleAuthData): Promise<APIResponse<BackendResponse<AuthResponse>>> {
    return this.post<BackendResponse<AuthResponse>>('/auth/google', authData, { skipRetry: true });
  }

  /**
   * Apple OAuth authentication
   */
  async appleAuth(authData: AppleAuthData): Promise<APIResponse<BackendResponse<AuthResponse>>> {
    return this.post<BackendResponse<AuthResponse>>('/auth/apple', authData, { skipRetry: true });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<APIResponse<BackendResponse<RefreshTokenResponse>>> {
    return this.post<BackendResponse<RefreshTokenResponse>>('/auth/refresh-token', { refreshToken }, { skipRetry: true });
  }

  /**
   * Check email status (if email exists)
   */
  async checkEmailStatus(email: string): Promise<APIResponse<BackendResponse<{ exists: boolean; provider?: string }>>> {
    return this.get<BackendResponse<{ exists: boolean; provider?: string }>>(`/auth/check-email/${email}`, { skipRetry: true });
  }

  // ============ PASSWORD RESET METHODS ============

  /**
   * Request password reset
   */
  async forgotPassword(data: PasswordResetData): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/forgot-password', data, { skipRetry: true });
  }

  /**
   * Verify OTP for password reset
   */
  async verifyOtp(data: OTPVerificationData): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/verify-otp', data, { skipRetry: true });
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(data: ResetPasswordData): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/reset-password', data, { skipRetry: true });
  }

  /**
   * Setup password for service providers
   */
  async setupPassword(data: SetupPasswordData): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/setup-password', data, { skipRetry: true });
  }

  // ============ PROTECTED USER METHODS ============

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<APIResponse<User>> {
    const response = await this.get<BackendResponse<User>>('/auth/me');
    // Extract data from BackendResponse wrapper for backward compatibility
    if (response.ok && response.data.success) {
      return {
        ...response,
        data: response.data.data
      };
    }
    throw new Error(response.data.message || 'Failed to get user profile');
  }

  /**
   * Update current user profile
   */
  async updateMe(profileData: Partial<User>): Promise<APIResponse<BackendResponse<User>>> {
    return this.put<BackendResponse<User>>('/auth/me', profileData);
  }

  /**
   * Update profile image
   */
  async updateProfileImage(imageFile: File): Promise<APIResponse<BackendResponse<{ profileImage: string }>>> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.put<BackendResponse<{ profileImage: string }>>('/auth/me/image', formData);
  }

  /**
   * Change password from profile
   */
  async changePassword(data: ChangePasswordData): Promise<APIResponse<BackendResponse<any>>> {
    return this.put<BackendResponse<any>>('/auth/me/password', data);
  }

  /**
   * Update document URL
   */
  async updateDocumentUrl(documentType: string, documentUrl: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.put<BackendResponse<any>>('/auth/me/document-url', { documentType, documentUrl });
  }

  /**
   * Get user documents
   */
  async getUserDocuments(): Promise<APIResponse<BackendResponse<Record<string, string>>>> {
    return this.get<BackendResponse<Record<string, string>>>('/auth/me/documents');
  }

  /**
   * Remove document URL
   */
  async removeDocumentUrl(documentType: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.delete<BackendResponse<any>>(`/auth/me/documents/${documentType}`);
  }

  // ============ SESSION MANAGEMENT ============

  /**
   * User logout
   */
  async logout(): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/logout', {}, { skipRetry: true });
  }

  /**
   * Logout from all devices
   */
  async logoutAllDevices(): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/logout-all');
  }

  /**
   * Get user sessions
   */
  async getUserSessions(): Promise<APIResponse<BackendResponse<UserSession[]>>> {
    return this.get<BackendResponse<UserSession[]>>('/auth/sessions');
  }

  // ============ TOUR GUIDE METHODS ============

  /**
   * Update tour guide employment type
   */
  async updateTourGuideType(employmentType: string): Promise<APIResponse<BackendResponse<User>>> {
    return this.put<BackendResponse<User>>('/auth/tourguide/employment-type', { employmentType });
  }

  // ============ KYC METHODS ============

  /**
   * Submit KYC documents
   */
  async submitKYC(kycData: KYCData): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>('/auth/kyc/submit', kycData);
  }

  /**
   * Get KYC status
   */
  async getKYCStatus(): Promise<APIResponse<BackendResponse<any>>> {
    return this.get<BackendResponse<any>>('/auth/kyc/status');
  }

  // ============ ADMIN METHODS ============

  /**
   * Get user statistics (admin only)
   */
  async getUserStatistics(): Promise<APIResponse<BackendResponse<any>>> {
    return this.get<BackendResponse<any>>('/auth/admin/statistics');
  }

  /**
   * Get all users (admin)
   */
  async getAllUsers(params?: any): Promise<APIResponse<BackendResponse<User[]>>> {
    return this.get<BackendResponse<User[]>>('/auth/admin/users', { params });
  }

  /**
   * Create user (admin)
   */
  async adminCreateUser(userData: any): Promise<APIResponse<BackendResponse<User>>> {
    return this.post<BackendResponse<User>>('/auth/admin/users', userData);
  }

  /**
   * Get user by email (admin)
   */
  async getUserByEmail(email: string): Promise<APIResponse<BackendResponse<User>>> {
    return this.get<BackendResponse<User>>(`/auth/admin/users/email/${email}`);
  }

  /**
   * Get users by provider (admin)
   */
  async getUsersByProvider(provider: string): Promise<APIResponse<BackendResponse<User[]>>> {
    return this.get<BackendResponse<User[]>>(`/auth/admin/users/provider/${provider}`);
  }

  /**
   * Get users by type (admin)
   */
  async getUsersByType(userType: string): Promise<APIResponse<BackendResponse<User[]>>> {
    return this.get<BackendResponse<User[]>>(`/auth/admin/users/type/${userType}`);
  }

  /**
   * Get user by ID (admin)
   */
  async getUserById(id: string): Promise<APIResponse<BackendResponse<User>>> {
    return this.get<BackendResponse<User>>(`/auth/admin/users/${id}`);
  }

  /**
   * Update user (admin)
   */
  async adminUpdateUser(id: string, userData: any): Promise<APIResponse<BackendResponse<User>>> {
    return this.put<BackendResponse<User>>(`/auth/admin/users/${id}`, userData);
  }

  /**
   * Delete user (admin)
   */
  async adminDeleteUser(id: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.delete<BackendResponse<any>>(`/auth/admin/users/${id}`);
  }

  /**
   * Suspend user (admin)
   */
  async adminSuspendUser(id: string, reason?: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>(`/auth/admin/users/${id}/suspend`, { reason });
  }

  /**
   * Activate user (admin)
   */
  async adminActivateUser(id: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>(`/auth/admin/users/${id}/activate`);
  }

  /**
   * Reset user password (admin)
   */
  async adminResetUserPassword(id: string): Promise<APIResponse<BackendResponse<any>>> {
    return this.post<BackendResponse<any>>(`/auth/admin/users/${id}/reset-password`);
  }

  // ============ FILE UPLOAD UTILITIES ============

  /**
   * Upload single file
   */
  async uploadFile(file: File, category: string = 'general'): Promise<APIResponse<BackendResponse<{ url: string }>>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    
    return this.post<BackendResponse<{ url: string }>>('/upload', formData);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[], category: string = 'general'): Promise<APIResponse<BackendResponse<{ urls: string[] }>>> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    formData.append('category', category);
    
    return this.post<BackendResponse<{ urls: string[] }>>('/upload/multiple', formData);
  }

  // ============ UTILITY METHODS ============

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    return new Date(dateString).toLocaleDateString('en-US', options || defaultOptions);
  }

  static isSuccess<T>(response: BackendResponse<T>): boolean {
    return response.success === true;
  }

  static extractData<T>(response: BackendResponse<T>): T {
    return response.data;
  }
}

// Export singleton instance
const api = new APIService();
export default api;