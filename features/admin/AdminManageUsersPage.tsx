
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetUsers, adminUpdateUser } from '../../services/adminService';
import { User, ApiError, PaginatedResponse, UserIdVerificationStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';

export const AdminManageUsersPage: React.FC = () => {
  const [usersResponse, setUsersResponse] = useState<PaginatedResponse<User & {is_admin_role?: boolean}> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Add search and pagination state

  const fetchUsers = (page = 1) => {
    setIsLoading(true);
    adminGetUsers({ page }) // Add search query later
      .then(setUsersResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load users."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleToggleActive = async (user: User) => {
      if (!user.id) return;
      // Optimistic update or show loading state on button
      try {
          await adminUpdateUser(user.id, { is_active: !user.is_active });
          fetchUsers(usersResponse?.meta.current_page || 1); // Refresh
      } catch (err) {
          setError("Failed to update user status."); // Show more specific error
      }
  }

  if (isLoading && !usersResponse) return <LoadingSpinner message="Loading users..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Users</h1>
      {/* TODO: Add search input and filters */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email / Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Verified</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usersResponse?.data.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{user.email}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {user.id_verification_status?.replace('_', ' ') || 'Not Submitted'}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(user as any).is_admin_role ? 'Admin' : 'User'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link to={ROUTE_PATHS.ADMIN_USER_DETAIL.replace(':userId', String(user.id))} className="text-blue-600 hover:text-blue-900">View/Edit</Link>
                  <Button onClick={() => handleToggleActive(user)} size="sm" variant={user.is_active ? "danger" : "primary"}>
                      {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
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
