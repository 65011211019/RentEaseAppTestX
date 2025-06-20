import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { adminGetUserById, adminUpdateUser, adminVerifyUserId } from '../../services/adminService'; // Assuming these exist
import { User, ApiError, UserIdVerificationStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';


const adminGetUserByIdMock = (id: number): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = mockUserDatabase[id];
            if(user) resolve(user);
            else reject({message: "User not found by admin service"} as ApiError);
        }, 300);
    });
}


export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add states for editing form if needed

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      adminGetUserByIdMock(Number(userId)) // Replace with actual service call
        .then(setUserData)
        .catch(err => setError((err as ApiError).message || "Failed to load user details."))
        .finally(() => setIsLoading(false));
    }
  }, [userId]);

  if (isLoading) return <LoadingSpinner message="Loading user details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!userData) return <div className="p-4 text-center">User not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.ADMIN_MANAGE_USERS} className="text-blue-600 hover:underline mb-6 block">&larr; Back to All Users</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Details: {userData.first_name} {userData.last_name} (@{userData.username})</h1>
      
      <Card className="mb-6">
        <CardContent>
            <h2 className="text-xl font-semibold mb-3">Account Information</h2>
            <p><strong>Email:</strong> {userData.email} {userData.email_verified_at ? <span className="text-green-500">(Verified)</span> : <span className="text-red-500">(Not Verified)</span>}</p>
            <p><strong>Phone:</strong> {userData.phone_number || 'N/A'}</p>
            <p><strong>Status:</strong> {userData.is_active ? 'Active' : 'Inactive'}</p>
            <p><strong>Joined:</strong> {new Date(userData.created_at || Date.now()).toLocaleDateString()}</p>
            <p><strong>Last Login:</strong> {userData.last_login_at ? new Date(userData.last_login_at).toLocaleString() : 'N/A'}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
            <h2 className="text-xl font-semibold mb-3">ID Verification</h2>
            <p><strong>Status:</strong> <span className="capitalize">{userData.id_verification_status?.replace('_', ' ') || 'Not Submitted'}</span></p>
            {userData.id_document_type && <p><strong>Doc Type:</strong> {userData.id_document_type.toUpperCase()}</p>}
            {userData.id_document_number && <p><strong>Doc Number:</strong> {userData.id_document_number}</p>}
            {/* Display images if URLs exist */}
             {userData.id_verification_status === UserIdVerificationStatus.PENDING && (
                <div className="mt-4">
                    <Button variant="primary" onClick={() => alert("Verify action TBD")}>Verify ID</Button>
                    <Button variant="danger" className="ml-2" onClick={() => alert("Reject action TBD")}>Reject ID</Button>
                </div>
             )}
        </CardContent>
      </Card>
      
      {/* TODO: Add forms for editing user details, changing roles, etc. */}
      <Card>
          <CardContent>
              <h2 className="text-xl font-semibold mb-3">Admin Actions</h2>
              <p className="italic text-gray-500">User editing and role management forms will appear here. (Coming Soon)</p>
          </CardContent>
      </Card>

    </div>
  );
};
