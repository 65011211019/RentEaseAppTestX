import { Rental, CreateRentalPayload, PaymentProofPayload, ReviewPayload, ApiError, PaginatedResponse, RentalStatus, PaymentStatus, Review, RentalPickupMethod } from '../types';
import axios from 'axios';

const API_URL = 'https:/renteaseapptestapi.onrender.com/api';

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

export const createRentalRequest = async (payload: CreateRentalPayload): Promise<Rental> => {
  try {
    const response = await api.post(`/rentals`, payload);
    return response.data.data.data;
  } catch (error) {
    console.error('Error creating rental request:', error);
    throw error;
  }
};

export const getRentalDetails = async (rentalIdOrUid: number | string, userId: number, userRole: 'renter' | 'owner' | 'admin'): Promise<Rental> => {
  try {
    const response = await api.get(`/rentals/${rentalIdOrUid}`, {
      params: { user_id: userId, user_role: userRole }
    });
    return response.data.data.data;
  } catch (error) {
    console.error('Error fetching rental details:', error);
    throw error;
  }
};

export const getRentalsForUser = async (userId: number, role: 'renter' | 'owner', params: { status?: string, page?: number, limit?: number }): Promise<PaginatedResponse<Rental>> => {
  try {
    const response = await api.get(`/rentals`, {
      params: {
        user_id: userId,
        role,
        ...params
      }
    });
    return {
      data: response.data.data,
      meta: {
        current_page: response.data.pagination.page,
        last_page: response.data.pagination.total_pages,
        per_page: response.data.pagination.limit,
        total: response.data.pagination.total,
        from: (response.data.pagination.page - 1) * response.data.pagination.limit + 1,
        to: Math.min(response.data.pagination.page * response.data.pagination.limit, response.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching rentals for user:', error);
    throw error;
  }
};

export const getOwnerRentals = async (params: { 
  status?: string, 
  q?: string, 
  date_from?: string, 
  date_to?: string, 
  page?: number, 
  limit?: number 
}): Promise<PaginatedResponse<Rental>> => {
  try {
    const response = await api.get('/owners/me/rentals', { params });
    
    // Transform the response to match our PaginatedResponse interface
    return {
      data: response.data.data.data || [],
      meta: {
        current_page: response.data.data.pagination.page,
        last_page: response.data.data.pagination.totalPages,
        per_page: response.data.data.pagination.limit,
        total: response.data.data.pagination.total,
        from: (response.data.data.pagination.page - 1) * response.data.data.pagination.limit + 1,
        to: Math.min(response.data.data.pagination.page * response.data.data.pagination.limit, response.data.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching owner rentals:', error);
    throw error;
  }
};

export const getRentalByIdOrUid = async (rentalIdOrUid: string | number): Promise<Rental> => {
  try {
    const response = await api.get(`/rentals/${rentalIdOrUid}`);
    return response.data.data.data;
  } catch (error) {
    console.error('Error fetching rental details:', error);
    throw error;
  }
};

export const approveRentalRequest = async (rentalIdOrUid: string | number): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/approve`);
    return response.data.data.data;
  } catch (error) {
    console.error('Error approving rental request:', error);
    throw error;
  }
};

export const rejectRentalRequest = async (rentalIdOrUid: string | number, reason: string): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/reject`, { reason });
    return response.data.data.data;
  } catch (error) {
    console.error('Error rejecting rental request:', error);
    throw error;
  }
};

export const submitPaymentProof = async (
  rentalId: number | string,
  payload: { payment_proof_image: File; transaction_time?: string; amount_paid?: number }
): Promise<Rental> => {
  const formData = new FormData();
  formData.append('payment_proof_image', payload.payment_proof_image);
  if (payload.transaction_time) formData.append('transaction_time', payload.transaction_time);
  if (payload.amount_paid) formData.append('amount_paid', String(payload.amount_paid));

  const response = await api.put(`/rentals/${rentalId}/payment-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data.data;
};

export const submitReview = async (payload: ReviewPayload, renterId: number): Promise<Review> => {
  try {
    const response = await api.post(`/rentals/${payload.rental_id}/review`, {
      ...payload,
      renter_id: renterId
    });
    return response.data.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

export const getProductReviews = async (productId: number, params: {page?:number, limit?:number}): Promise<PaginatedResponse<Review>> => {
  try {
    const response = await api.get(`/products/${productId}/reviews`, {
      params
    });
    return {
      data: response.data.data,
      meta: {
        current_page: response.data.pagination.page,
        last_page: response.data.pagination.total_pages,
        per_page: response.data.pagination.limit,
        total: response.data.pagination.total,
        from: (response.data.pagination.page - 1) * response.data.pagination.limit + 1,
        to: Math.min(response.data.pagination.page * response.data.pagination.limit, response.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    throw error;
  }
};

export const reportReturnByOwner = async (rentalId: number, ownerId: number, payload: { actual_return_time: string; return_condition_status: string; notes_from_owner_on_return?: string; initiate_claim?: boolean }): Promise<Rental> => {
  try {
    const response = await api.post(`/rentals/${rentalId}/report-return`, {
      owner_id: ownerId,
      ...payload
    });
    return response.data.data;
  } catch (error) {
    console.error('Error reporting return:', error);
    throw error;
  }
};

export const markPaymentSlipInvalid = async (rentalIdOrUid: string | number, reason: string): Promise<Rental> => {
  try {
    const response = await api.put(`/rentals/${rentalIdOrUid}/mark-slip-invalid`, { reason });
    return response.data.data.data;
  } catch (error) {
    console.error('Error marking payment slip as invalid:', error);
    throw error;
  }
};

export const getMyRentals = async (params: { status?: string, q?: string, page?: number, limit?: number } = {}): Promise<PaginatedResponse<Rental>> => {
  try {
    const response = await api.get('/renters/me/rentals', { params });
    return {
      data: response.data.data.data,
      meta: {
        current_page: response.data.data.pagination.page,
        last_page: response.data.data.pagination.totalPages,
        per_page: response.data.data.pagination.limit,
        total: response.data.data.pagination.total,
        from: (response.data.data.pagination.page - 1) * response.data.data.pagination.limit + 1,
        to: Math.min(response.data.data.pagination.page * response.data.data.pagination.limit, response.data.data.pagination.total)
      }
    };
  } catch (error) {
    console.error('Error fetching my rentals:', error);
    throw error;
  }
};

export const cancelRental = async (rentalId: number | string, reason: string): Promise<Rental> => {
  if (!reason || reason.trim() === '') throw new Error('Cancellation reason is required');
  try {
    const response = await api.put(`/rentals/${rentalId}/cancel`, { reason });
    return response.data.data.data;
  } catch (error) {
    console.error('Error cancelling rental:', error);
    throw error;
  }
}; 