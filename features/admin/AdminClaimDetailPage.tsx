
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { adminGetClaimById, adminUpdateClaimStatus } from '../../services/adminService'; // Assuming these exist
import { Claim, ApiError, ClaimStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { getClaimDetails } from '../../services/claimService'; // Using user-facing for mock

export const AdminClaimDetailPage: React.FC = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: State for admin actions (e.g. resolution notes, new status)

  useEffect(() => {
    if (claimId) {
      setIsLoading(true);
      getClaimDetails(Number(claimId), 0) // 0 for userId, assuming admin has universal access for this mock
        .then(setClaim)
        .catch(err => setError((err as ApiError).message || "Failed to load claim details."))
        .finally(() => setIsLoading(false));
    }
  }, [claimId]);

  if (isLoading) return <LoadingSpinner message="Loading claim details for admin..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!claim) return <div className="p-4 text-center">Claim not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.ADMIN_MANAGE_CLAIMS} className="text-blue-600 hover:underline mb-6 block">&larr; Back to All Claims</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin View: Claim {claim.claim_uid?.substring(0,8) || claim.id}</h1>
      
      <Card className="mb-6">
        <CardContent>
            <h2 className="text-xl font-semibold mb-3">Claim Information</h2>
            <p><strong>Product:</strong> {claim.product_title || 'N/A'} (Rental ID: {claim.rental_id})</p>
            <p><strong>Type:</strong> {claim.claim_type.toUpperCase()}</p>
            <p><strong>Reported By:</strong> {claim.reporter_name} (ID: {claim.reported_by_id})</p>
            <p><strong>Accused Party:</strong> {claim.accused_name} (ID: {claim.accused_id})</p>
            <p><strong>Date Reported:</strong> {new Date(claim.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> <span className="font-medium">{claim.status.replace(/_/g, ' ').toUpperCase()}</span></p>
             <div className="py-2">
                <h3 className="font-semibold">Claim Details:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{claim.claim_details}</p>
            </div>
            {claim.requested_amount && <p><strong>Requested Amount:</strong> ฿{claim.requested_amount.toLocaleString()}</p>}
        </CardContent>
      </Card>

      {/* TODO: Display claim history/chat, attachments */}
      {/* TODO: Admin action form (update status, add resolution notes, set resolved amount) */}
       <Card>
          <CardContent>
              <h2 className="text-xl font-semibold mb-3">Admin Mediation & Resolution</h2>
              <p className="italic text-gray-500">Forms to update claim status, add resolution notes, and set amounts will appear here. (Coming Soon)</p>
              {/* Example:
                <select defaultValue={claim.status}>...</select>
                <textarea placeholder="Resolution notes..."></textarea>
                <InputField type="number" label="Resolved Amount"/>
                <Button>Update Claim</Button>
              */}
          </CardContent>
      </Card>
    </div>
  );
};
