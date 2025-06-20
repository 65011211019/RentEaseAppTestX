
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { adminGetClaims } from '../../services/adminService'; // Assuming this exists
import { Claim, ApiError, PaginatedResponse, ClaimStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { mockClaimsDB } from '../../services/claimService'; // Using mock data

// Mock
const adminGetClaimsMock = async (params: { status?: string, page?:number, limit?:number }): Promise<PaginatedResponse<Claim>> => {
     return new Promise(resolve => {
        setTimeout(() => {
            let claims = mockClaimsDB;
            if (params.status) {
                claims = claims.filter(c => c.status === params.status);
            }
            resolve({ data: claims, meta: { total: claims.length, current_page: 1, per_page: 10, last_page: 1, from:0, to:0 } });
        }, 500);
    });
}


export const AdminManageClaimsPage: React.FC = () => {
  const [claimsResponse, setClaimsResponse] = useState<PaginatedResponse<Claim> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');


  const fetchClaims = (page = 1) => {
    setIsLoading(true);
    adminGetClaimsMock({ status: statusFilter, page }) // Replace with actual service call
      .then(setClaimsResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load claims."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  if (isLoading && !claimsResponse) return <LoadingSpinner message="Loading claims..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Claims</h1>
       <div className="mb-6">
          <label htmlFor="statusFilter" className="mr-2 font-medium">Filter by status:</label>
          <select 
            id="statusFilter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md shadow-sm"
          >
              <option value="">All</option>
              {Object.values(ClaimStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental/Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parties (Reporter/Accused)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {claimsResponse?.data.map(claim => (
              <tr key={claim.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{claim.claim_uid?.substring(0,8) || claim.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rental: {claim.rental_id} <br/> Product: {claim.product_title || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {claim.reporter_name || claim.reported_by_id} / {claim.accused_name || claim.accused_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.claim_type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        {claim.status.replace(/_/g, ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={ROUTE_PATHS.ADMIN_CLAIM_DETAIL.replace(':claimId', String(claim.id))} className="text-blue-600 hover:text-blue-900">View/Mediate</Link>
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
