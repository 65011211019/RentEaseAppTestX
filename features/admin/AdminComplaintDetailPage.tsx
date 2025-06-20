
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { adminGetComplaintById, adminUpdateComplaintStatus } from '../../services/adminService'; // Assuming these exist
import { Complaint, ApiError, ComplaintStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { mockComplaintsDB } from '../../services/complaintService'; // Using mock data

// Mock
const getComplaintByIdMock = async (id: number): Promise<Complaint> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const complaint = mockComplaintsDB.find(c => c.id === id);
            if (complaint) resolve(complaint);
            else reject({message: "Complaint not found"} as ApiError);
        }, 300);
    });
}

export const AdminComplaintDetailPage: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: State for admin actions

  useEffect(() => {
    if (complaintId) {
      setIsLoading(true);
      getComplaintByIdMock(Number(complaintId)) // Replace with actual service call
        .then(setComplaint)
        .catch(err => setError((err as ApiError).message || "Failed to load complaint details."))
        .finally(() => setIsLoading(false));
    }
  }, [complaintId]);

  if (isLoading) return <LoadingSpinner message="Loading complaint details for admin..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!complaint) return <div className="p-4 text-center">Complaint not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.ADMIN_MANAGE_COMPLAINTS} className="text-blue-600 hover:underline mb-6 block">&larr; Back to All Complaints</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin View: Complaint {complaint.complaint_uid?.substring(0,8) || complaint.id}</h1>
      
      <Card className="mb-6">
        <CardContent>
            <h2 className="text-xl font-semibold mb-3">{complaint.title}</h2>
            <p><strong>Complainant ID:</strong> {complaint.complainant_id}</p>
            <p><strong>Type:</strong> {complaint.complaint_type.replace(/_/g,' ').toUpperCase()}</p>
            <p><strong>Status:</strong> <span className="font-medium">{complaint.status.replace(/_/g, ' ').toUpperCase()}</span></p>
            <p><strong>Date Submitted:</strong> {new Date(complaint.created_at).toLocaleString()}</p>
            {complaint.subject_user_id && <p><strong>Subject User ID:</strong> {complaint.subject_user_id}</p>}
            {complaint.related_product_id && <p><strong>Related Product ID:</strong> {complaint.related_product_id}</p>}
            {complaint.related_rental_id && <p><strong>Related Rental ID:</strong> {complaint.related_rental_id}</p>}
             <div className="py-2">
                <h3 className="font-semibold">Complaint Details:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{complaint.details}</p>
            </div>
        </CardContent>
      </Card>

      {/* TODO: Admin action form (update status, add resolution notes, assign handler) */}
       <Card>
          <CardContent>
              <h2 className="text-xl font-semibold mb-3">Admin Actions & Resolution</h2>
              <p className="italic text-gray-500">Forms to update complaint status and add resolution notes will appear here. (Coming Soon)</p>
          </CardContent>
      </Card>
    </div>
  );
};
