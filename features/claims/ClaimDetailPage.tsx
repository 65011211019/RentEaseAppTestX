
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClaimDetails } from '../../services/claimService';
import { Claim, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

export const ClaimDetailPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const { user } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && claimId) {
      setIsLoading(true);
      getClaimDetails(Number(claimId), user.id)
        .then(setClaim)
        .catch(err => setError((err as ApiError).message || "Failed to load claim details."))
        .finally(() => setIsLoading(false));
    }
  }, [claimId, user]);

  if (isLoading) return <LoadingSpinner message="Loading claim details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!claim) return <div className="p-4 text-center">Claim not found or not accessible.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.CLAIMS_HISTORY} className="text-blue-600 hover:underline mb-6 block">&larr; Back to Claims History</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Claim Details</h1>
      
      <Card>
        <CardContent className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-700">Claim ID: {claim.claim_uid?.substring(0,8) || claim.id}</h2>
            <p><strong>Related Rental Product:</strong> {claim.product_title || 'N/A'}</p>
            <p><strong>Status:</strong> <span className="font-medium">{claim.status.replace(/_/g, ' ').toUpperCase()}</span></p>
            <p><strong>Claim Type:</strong> {claim.claim_type.toUpperCase()}</p>
            <p><strong>Reported By:</strong> {claim.reporter_name} (ID: {claim.reported_by_id})</p>
            <p><strong>Accused Party:</strong> {claim.accused_name} (ID: {claim.accused_id})</p>
            <p><strong>Date Reported:</strong> {new Date(claim.created_at).toLocaleString()}</p>
            <div className="py-2">
                <h3 className="font-semibold">Claim Details:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{claim.claim_details}</p>
            </div>
            {claim.requested_amount && <p><strong>Requested Amount:</strong> ฿{claim.requested_amount.toLocaleString()}</p>}
            {claim.resolution_details && 
                <div className="py-2 border-t mt-2">
                    <h3 className="font-semibold">Resolution Details:</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{claim.resolution_details}</p>
                    {claim.resolved_amount && <p><strong>Resolved Amount:</strong> ฿{claim.resolved_amount.toLocaleString()}</p>}
                    {claim.closed_at && <p><strong>Date Closed:</strong> {new Date(claim.closed_at).toLocaleString()}</p>}
                </div>
            }
             {/* TODO: Display attachments if any */}
             <div className="mt-4">
                 <Link to={ROUTE_PATHS.CLAIM_MANAGEMENT.replace(':claimId', String(claim.id))}>
                    <Button variant="primary">Manage/Respond to Claim</Button>
                 </Link>
             </div>
        </CardContent>
      </Card>
    </div>
  );
};
