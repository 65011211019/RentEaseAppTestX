
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClaimsForUser } from '../../services/claimService';
import { Claim, ApiError, PaginatedResponse } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

export const ClaimsHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [claimsResponse, setClaimsResponse] = useState<PaginatedResponse<Claim> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      getClaimsForUser(user.id, {}) // Add pagination/filter params if needed
        .then(setClaimsResponse)
        .catch(err => setError((err as ApiError).message || "Failed to load claims history."))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <LoadingSpinner message="Loading claims history..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Claims History</h1>
      {claimsResponse && claimsResponse.data.length > 0 ? (
        <div className="space-y-4">
          {claimsResponse.data.map(claim => (
            <Card key={claim.id}>
              <CardContent>
                <h2 className="text-lg font-semibold text-gray-800">
                  Claim ID: {claim.claim_uid?.substring(0,8) || claim.id} - Product: {claim.product_title || 'N/A'}
                </h2>
                <p className="text-sm text-gray-600">Status: <span className="font-medium">{claim.status.replace(/_/g, ' ').toUpperCase()}</span></p>
                <p className="text-sm text-gray-600">Type: {claim.claim_type.toUpperCase()}</p>
                <p className="text-sm text-gray-500">Reported: {new Date(claim.created_at).toLocaleDateString()}</p>
                <div className="mt-3">
                  <Link to={ROUTE_PATHS.CLAIM_DETAIL.replace(':claimId', String(claim.id))}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* TODO: Pagination */}
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No claims found.</h3>
            <p className="text-gray-500">Your claims history is currently empty.</p>
        </div>
      )}
    </div>
  );
};
