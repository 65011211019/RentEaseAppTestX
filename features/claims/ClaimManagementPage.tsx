import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClaimDetails } from '../../services/claimService'; // Assuming this exists
import { Claim, ApiError, ClaimStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

export const ClaimManagementPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const { user } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && claimId) {
      setIsLoading(true);
      getClaimDetails(Number(claimId), user.id) // Or a specific management-focused fetch
        .then(setClaim)
        .catch(err => setError((err as ApiError).message || "Failed to load claim details for management."))
        .finally(() => setIsLoading(false));
    }
  }, [claimId, user]);

  if (isLoading) return <LoadingSpinner message="Loading claim for management..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!claim) return <div className="p-4 text-center">Claim not found or not accessible.</div>;

  // Determine user's role in this claim (reporter, accused, or admin if applicable)
  const userRole = user?.id === claim.reported_by_id ? 'reporter' : user?.id === claim.accused_id ? 'accused' : 'observer'; // Add admin check later

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.CLAIMS_HISTORY} className="text-blue-600 hover:underline mb-6 block">&larr; Back to Claims History</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Claim ID: {claim.claim_uid?.substring(0,8) || claim.id}</h1>

      <Card className="mb-6">
        <CardContent>
          <h2 className="text-xl font-semibold text-gray-700">Claim for Product: {claim.product_title || 'N/A'}</h2>
          <p><strong>Status:</strong> <span className="font-medium">{claim.status.replace(/_/g, ' ').toUpperCase()}</span></p>
          <p><strong>Type:</strong> {claim.claim_type.toUpperCase()}</p>
          <p><strong>Reported by:</strong> {claim.reporter_name} (against {claim.accused_name})</p>
          <p><strong>Details:</strong> {claim.claim_details}</p>
          {claim.requested_amount && <p><strong>Requested Amount:</strong> ฿{claim.requested_amount.toLocaleString()}</p>}
        </CardContent>
      </Card>

      {/* TODO: Add sections for claim timeline/messages, attachments, and actions based on user role and claim status */}
      {/* For example: */}
      {/* - Renter can respond if status is OPEN */}
      {/* - Owner can counter-respond */}
      {/* - Both can upload evidence */}
      {/* - Admin can mediate and update status/resolution */}

      <Card>
          <CardContent>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Actions / Discussion</h3>
              <p className="text-gray-500 italic">Claim management actions and discussion thread will appear here. (Coming Soon)</p>
              {userRole === 'accused' && claim.status === ClaimStatus.OPEN && (
                  <Button className="mt-4">Respond to Claim</Button>
              )}
          </CardContent>
      </Card>

    </div>
  );
};