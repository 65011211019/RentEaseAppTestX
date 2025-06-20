
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { adminGetComplaints } from '../../services/adminService'; // Assuming this exists
import { Complaint, ApiError, PaginatedResponse, ComplaintStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { mockComplaintsDB } from '../../services/complaintService'; // Using mock data

// Mock
const adminGetComplaintsMock = async (params: { status?: string, page?:number, limit?:number }): Promise<PaginatedResponse<Complaint>> => {
     return new Promise(resolve => {
        setTimeout(() => {
            let complaints = mockComplaintsDB;
            if (params.status) {
                complaints = complaints.filter(c => c.status === params.status);
            }
            resolve({ data: complaints, meta: { total: complaints.length, current_page: 1, per_page: 10, last_page: 1, from:0,to:0 } });
        }, 500);
    });
}

export const AdminManageComplaintsPage: React.FC = () => {
  const [complaintsResponse, setComplaintsResponse] = useState<PaginatedResponse<Complaint> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchComplaints = (page = 1) => {
    setIsLoading(true);
    adminGetComplaintsMock({ status: statusFilter, page }) // Replace with actual service call
      .then(setComplaintsResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load complaints."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  if (isLoading && !complaintsResponse) return <LoadingSpinner message="Loading complaints..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Complaints</h1>
        <div className="mb-6">
          <label htmlFor="statusFilter" className="mr-2 font-medium">Filter by status:</label>
          <select 
            id="statusFilter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md shadow-sm"
          >
              <option value="">All</option>
              {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
          </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complainant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {complaintsResponse?.data.map(complaint => (
              <tr key={complaint.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{complaint.complaint_uid?.substring(0,8) || complaint.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.complainant_id}</td> {/* TODO: Fetch complainant name */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.complaint_type.replace(/_/g,' ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {complaint.status.replace(/_/g, ' ')}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={ROUTE_PATHS.ADMIN_COMPLAINT_DETAIL.replace(':complaintId', String(complaint.id))} className="text-blue-600 hover:text-blue-900">View/Resolve</Link>
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
