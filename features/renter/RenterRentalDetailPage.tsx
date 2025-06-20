import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, cancelRental } from '../../services/rentalService'; // Assuming this can be used by renters too
import { Rental, ApiError, RentalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

export const RenterRentalDetailPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user } = useAuth();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    if (!rentalId) {
      setError("Rental ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getRentalDetails(rentalId, user.id, 'renter')
      .then(setRental)
      .catch(err => setError((err as ApiError).message || "Failed to load rental details"))
      .finally(() => setIsLoading(false));
  }, [rentalId, user]);

  const handleCancelRental = async () => {
    if (!rental) return;
    if (!cancelReason.trim()) {
      setCancelError('กรุณาระบุเหตุผลในการยกเลิก');
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelRental(rental.id, cancelReason);
      setShowCancelDialog(false);
      // Refresh rental details
      setIsLoading(true);
      getRentalDetails(rentalId!, user!.id, 'renter')
        .then(setRental)
        .catch(err => setError((err as ApiError).message || 'Failed to load rental details'))
        .finally(() => setIsLoading(false));
    } catch (err) {
      setError((err as ApiError).message || 'Failed to cancel rental');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading rental details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">Rental not found.</div>;

  // Status message logic
  let statusBox = null;
  switch (rental.rental_status) {
    case RentalStatus.PENDING_OWNER_APPROVAL:
      statusBox = (
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded">
          <strong>Waiting for owner approval.</strong> Your rental request has been sent. Please wait for the owner to approve before proceeding to payment.
        </div>
      );
      break;
    case RentalStatus.PENDING_PAYMENT:
      statusBox = (
        <div className="bg-blue-100 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded">
          <strong>Approved!</strong> Please proceed to payment to confirm your rental.
        </div>
      );
      break;
    case RentalStatus.PENDING_VERIFICATION:
      statusBox = (
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded">
          <strong>Payment submitted.</strong> Waiting for owner/admin to verify your payment.
        </div>
      );
      break;
    case RentalStatus.CONFIRMED:
    case RentalStatus.ACTIVE:
      statusBox = (
        <div className="bg-green-100 border-l-4 border-green-400 text-green-800 p-4 mb-4 rounded">
          <strong>Rental confirmed!</strong> Please follow the instructions for pickup/delivery.
        </div>
      );
      break;
    case RentalStatus.COMPLETED:
      statusBox = (
        <div className="bg-gray-100 border-l-4 border-gray-400 text-gray-800 p-4 mb-4 rounded">
          <strong>Rental completed.</strong> Thank you for using our service! You can leave a review for the owner.
        </div>
      );
      break;
    case RentalStatus.REJECTED_BY_OWNER:
    case RentalStatus.CANCELLED_BY_OWNER:
    case RentalStatus.CANCELLED_BY_RENTER:
      statusBox = (
        <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-4 mb-4 rounded">
          <strong>Rental cancelled or rejected.</strong> {rental.cancellation_reason && (<span>Reason: {rental.cancellation_reason}</span>)}
        </div>
      );
      break;
    default:
      statusBox = null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.MY_RENTALS_RENTER} className="text-blue-600 hover:underline mb-6 block">&larr; Back to My Rentals</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Rental Details</h1>
      {statusBox}
      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-700">Item: {rental.product?.title}</h2>
          <p className="text-sm text-gray-500">Rental ID: {rental.rental_uid.substring(0,12)}...</p>
          <p><strong>Owner:</strong> {rental.owner?.first_name} {rental.owner?.last_name} (@{rental.owner?.username})</p>
          <p><strong>Renter:</strong> {rental.renter?.first_name} {rental.renter?.last_name} (@{rental.renter?.username})</p>
          <p><strong>Status:</strong> <span className="font-medium">{rental.rental_status.replace(/_/g, ' ').toUpperCase()}</span></p>
          <p><strong>Payment Status:</strong> {rental.payment_status.replace(/_/g, ' ').toUpperCase()}</p>
          <p><strong>Rental Period:</strong> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</p>
          <p><strong>Total Paid:</strong> ฿{(rental.final_amount_paid || rental.total_amount_due).toLocaleString()}</p>
          <p><strong>Pickup Method:</strong> {rental.pickup_method.replace('_',' ').toUpperCase()}</p>
          {rental.delivery_address && (
            <div className="bg-gray-50 p-3 rounded border mt-2">
              <strong>Delivery Address:</strong>
              <div>{rental.delivery_address.address_line1}</div>
              {rental.delivery_address.address_line2 && <div>{rental.delivery_address.address_line2}</div>}
              <div>{rental.delivery_address.sub_district || '-'}, {rental.delivery_address.district}, {rental.delivery_address.province_name || '-'} {rental.delivery_address.postal_code}</div>
              <div>Tel: {rental.delivery_address.phone_number}</div>
            </div>
          )}
          <div className="bg-gray-50 p-3 rounded border mt-2">
            <strong>Product Details:</strong>
            <div>Name: {rental.product?.title}</div>
            <div>Category: {rental.product?.category?.name}</div>
            <div>Price/Day: ฿{rental.product?.rental_price_per_day?.toLocaleString?.() || '-'}</div>
            <div>Deposit: ฿{rental.product?.security_deposit?.toLocaleString?.() || '-'}</div>
          </div>
          {rental.notes_from_renter && <p><strong>Your Notes:</strong> {rental.notes_from_renter}</p>}
          {rental.notes_from_owner_on_return && <p><strong>Owner's Return Notes:</strong> {rental.notes_from_owner_on_return}</p>}
          {rental.cancellation_reason && <p className="text-red-600"><strong>Cancellation Reason:</strong> {rental.cancellation_reason}</p>}
          {Boolean(rental.payment_proof_url) && (
            <div className="bg-blue-50 p-3 rounded border mt-2">
              <strong>Payment Slip:</strong>
              <div className="my-2">
                <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer">
                  <img src={rental.payment_proof_url!} alt="Payment Slip" className="max-w-xs rounded shadow border" />
                </a>
              </div>
              <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View/Download Slip</a>
            </div>
          )}

          <div className="pt-4 border-t mt-4">
            {rental.rental_status === RentalStatus.PENDING_PAYMENT && (
                <Link to={ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(rental.id))}>
                    <Button variant="primary" size="lg">Proceed to Payment</Button>
                </Link>
            )}
            {rental.rental_status === RentalStatus.COMPLETED && (
                 <Link to={ROUTE_PATHS.SUBMIT_REVIEW.replace(':rentalId', String(rental.id))}>
                    <Button variant="outline">Leave a Review</Button>
                 </Link>
            )}
            {/* Cancel button for allowed statuses */}
            {[RentalStatus.PENDING_OWNER_APPROVAL, RentalStatus.PENDING_PAYMENT, RentalStatus.CONFIRMED].includes(rental.rental_status) && (
              <Button variant="danger" size="md" className="mt-2" onClick={() => setShowCancelDialog(true)} disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Cancel Rental'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Cancel Rental Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Cancel Rental</h2>
            <p className="mb-2">Are you sure you want to cancel this rental?</p>
            <textarea
              className="w-full border rounded p-2 mb-3"
              placeholder="Reason for cancellation (required)"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={2}
            />
            {cancelError && <div className="text-red-600 text-sm mb-2">{cancelError}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>Back</Button>
              <Button variant="danger" onClick={handleCancelRental} isLoading={isCancelling}>Confirm Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
