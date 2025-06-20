
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetRentals } from '../../services/adminService';
import { Rental, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';

export const AdminManageRentalsPage: React.FC = () => {
  const [rentalsResponse, setRentalsResponse] = useState<PaginatedResponse<Rental> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRentals = (page = 1) => {
    setIsLoading(true);
    adminGetRentals({ page })
      .then(setRentalsResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load rentals."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  if (isLoading && !rentalsResponse) return <LoadingSpinner message="Loading rentals..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Rentals</h1>
      {/* TODO: Filters for rentals */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental UID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renter / Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rentalsResponse?.data.map(rental => (
              <tr key={rental.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rental.rental_uid.substring(0,8)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rental.product?.title || rental.product_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R: {rental.renter?.first_name || rental.renter_id} / O: {rental.owner?.first_name || rental.owner_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {rental.rental_status.replace(/_/g, ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={ROUTE_PATHS.ADMIN_RENTAL_DETAIL.replace(':rentalId', String(rental.id))} className="text-blue-600 hover:text-blue-900">View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* TODO: Pagination Controls */}
    </div>
  );
};
