import { API_BASE_URL } from '../constants';
import { RenterDashboardData, ApiError } from '../types';

export const getRenterDashboardData = async (): Promise<RenterDashboardData> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/renters/me/dashboard`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to fetch renter dashboard data');
        }

        const result = await response.json();
        console.log('Renter dashboard response:', result);
        
        // API response structure: { statusCode, data: { data: RenterDashboardData }, message, success }
        return result.data.data;
    } catch (error) {
        console.error('Error fetching renter dashboard data:', error);
        console.log('API error:', (error as any)?.response?.data);
        throw error;
    }
}; 