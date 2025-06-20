import { User, Product, Rental, Category, PaginatedResponse, UserIdVerificationStatus, ProductAdminApprovalStatus } from '../types';
import axios from 'axios';

const API_URL = 'https://renteaseapptestapi.onrender.com/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- User Management ---
export const adminGetUsers = async (params: { q?: string, page?: number, limit?: number }): Promise<PaginatedResponse<User & {is_admin_role?: boolean}>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
};

export const adminUpdateUser = async (userId: number, payload: Partial<User>): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}`, payload);
    return response.data;
};

export const adminVerifyUserId = async (userId: number, status: UserIdVerificationStatus, notes?: string): Promise<User> => {
    const response = await api.put(`/admin/users/${userId}/verify`, { status, notes });
    return response.data;
};

// --- Product Management ---
export const adminGetProducts = async (params: { q?: string, page?: number, limit?: number }): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/admin/products', { params });
    return response.data;
};

export const adminApproveProduct = async (productId: number, status: ProductAdminApprovalStatus, notes?: string): Promise<Product> => {
    const response = await api.put(`/admin/products/${productId}/approve`, { status, notes });
    return response.data;
};

// --- Rental Management ---
export const adminGetRentals = async (params: { q?: string, page?: number, limit?: number }): Promise<PaginatedResponse<Rental>> => {
    const response = await api.get('/admin/rentals', { params });
    return response.data;
};

// --- Category Management ---
export const adminGetCategories = async (): Promise<Category[]> => {
    const response = await api.get('/admin/categories');
    return response.data;
};

export const adminCreateCategory = async (payload: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.post('/admin/categories', payload);
    return response.data;
};

// --- System Settings & Static Content ---
export const adminGetSystemSettings = async (): Promise<any> => {
    const response = await api.get('/admin/settings');
    return response.data;
};

export const adminGetStaticPages = async (): Promise<any[]> => {
    const response = await api.get('/admin/static-pages');
    return response.data;
};

// Other admin functions for claims, complaints dashboards will go here
