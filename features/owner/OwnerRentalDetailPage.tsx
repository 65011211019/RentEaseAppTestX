import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRentalByIdOrUid, approveRentalRequest, rejectRentalRequest, markPaymentSlipInvalid } from '../../services/rentalService';
import { Rental, ApiError, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';

// Status badge component
const StatusBadge: React.FC<{ status: string; type: 'rental' | 'payment' }> = ({ status, type }) => {
  const { t } = useTranslation();
  
  const getStatusColor = () => {
    if (type === 'rental') {
      switch (status) {
        case 'completed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'active':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pending_owner_approval':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pending_payment':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'confirmed':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'return_pending':
          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'cancelled_by_renter':
        case 'cancelled_by_owner':
        case 'rejected_by_owner':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'dispute':
          return 'bg-pink-100 text-pink-800 border-pink-200';
        case 'expired':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'late_return':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      switch (status) {
        case 'paid':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'unpaid':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'failed':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'refunded':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {type === 'rental' 
        ? t(`ownerRentalDetailPage.status.rental.${status}`)
        : t(`ownerRentalDetailPage.status.payment.${status}`)
      }
    </span>
  );
};

export const OwnerRentalDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { rentalId } = useParams<{ rentalId: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { showSuccess, showError } = useAlert();
  const [invalidSlipDialogOpen, setInvalidSlipDialogOpen] = useState(false);
  const [invalidSlipReason, setInvalidSlipReason] = useState('');
  const [invalidSlipLoading, setInvalidSlipLoading] = useState(false);

  const fetchRental = async () => {
    if (!rentalId) {
      setError("Rental ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getRentalByIdOrUid(rentalId);
      setRental(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.loadFailed'));
      console.error('Error fetching rental:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRental();
  }, [rentalId]);

  const handleApprove = async () => {
    if (!rental) return;
    
    setActionLoading(true);
    try {
      await approveRentalRequest(rental.id);
      await fetchRental(); // Refresh data
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.approveFailed'));
      console.error('Error approving rental:', err);
    } finally {
        setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rental || !rejectReason.trim()) {
      setError(t('ownerRentalDetailPage.error.rejectReasonRequired'));
          return;
      }
    
      setActionLoading(true);
      try {
      await rejectRentalRequest(rental.id, rejectReason.trim());
      await fetchRental(); // Refresh data
      setShowRejectForm(false);
      setRejectReason("");
      } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.rejectFailed'));
      console.error('Error rejecting rental:', err);
      } finally {
          setActionLoading(false);
      }
  };

  const handleVerifyPayment = async () => {
    if (!rental) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${process.env.VITE_API_URL || 'https:/renteaseapptestapi.onrender.com/api'}/rentals/${rental.id}/verify-payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount_paid: rental.final_amount_paid || rental.total_amount_due }),
      });
      await fetchRental();
    } catch (err) {
      setError('Failed to verify payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSlipInvalid = async () => {
    if (!rental || !invalidSlipReason.trim()) {
      showError(t('ownerRentalDetailPage.invalidSlip.reasonRequired'));
      return;
    }
    setInvalidSlipLoading(true);
    try {
      await markPaymentSlipInvalid(rental.id, invalidSlipReason.trim());
      showSuccess(t('ownerRentalDetailPage.invalidSlip.success'));
      setInvalidSlipDialogOpen(false);
      setInvalidSlipReason('');
      await fetchRental();
    } catch (err) {
      showError(t('ownerRentalDetailPage.invalidSlip.error'));
    } finally {
      setInvalidSlipLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner message={t('ownerRentalDetailPage.loadingDetails')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">{t('ownerRentalDetailPage.error.rentalNotFound')}</div>;

  const canApprove = rental.rental_status === 'pending_owner_approval';
  const canProcessReturn = rental.rental_status === 'active' || rental.rental_status === 'return_pending';

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.OWNER_RENTAL_HISTORY} className="text-blue-600 hover:underline mb-6 block">
        {t('ownerRentalDetailPage.backToHistory')}
      </Link>
      
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {t('ownerRentalDetailPage.title')}
        </h1>
        <div className="text-sm text-gray-500">
          {t('ownerRentalDetailPage.rentalId', { id: rental.rental_uid?.substring(0, 8) || rental.id.toString().substring(0, 8) })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
      <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerRentalDetailPage.sections.rentalInformation')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{rental.product?.title}</h3>
                  {rental.product?.primary_image && (
                    <img 
                      src={rental.product.primary_image.image_url} 
                      alt={rental.product.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t('ownerRentalDetailPage.labels.rentalStatus')}</span>
                    <div className="mt-1">
                      <StatusBadge status={rental.rental_status} type="rental" />
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t('ownerRentalDetailPage.labels.paymentStatus')}</span>
                    <div className="mt-1">
                      <StatusBadge status={rental.payment_status} type="payment" />
                    </div>
                  </div>
                  
          <div>
                    <span className="text-sm font-medium text-gray-500">{t('ownerRentalDetailPage.labels.renter')}</span>
                    <p className="text-sm text-gray-700">
                      {rental.renter?.first_name} {rental.renter?.last_name}
                    </p>
          </div>
          
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t('ownerRentalDetailPage.labels.rentalPeriod')}</span>
                    <p className="text-sm text-gray-700">
                      {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">{t('ownerRentalDetailPage.labels.pickupMethod')}</span>
                    <p className="text-sm text-gray-700 capitalize">
                      {rental.pickup_method.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerRentalDetailPage.sections.financialDetails')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('ownerRentalDetailPage.labels.pricePerDay')}</span>
                    <span className="text-sm font-medium">฿{rental.rental_price_per_day_at_booking.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('ownerRentalDetailPage.labels.subtotal')}</span>
                    <span className="text-sm font-medium">฿{rental.calculated_subtotal_rental_fee.toLocaleString()}</span>
                  </div>
                  
                  {rental.security_deposit_at_booking && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('ownerRentalDetailPage.labels.securityDeposit')}</span>
                      <span className="text-sm font-medium">฿{rental.security_deposit_at_booking.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {rental.delivery_fee && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('ownerRentalDetailPage.labels.deliveryFee')}</span>
                      <span className="text-sm font-medium">฿{rental.delivery_fee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-sm font-medium text-gray-900">{t('ownerRentalDetailPage.labels.totalAmount')}</span>
                    <span className="text-sm font-bold">฿{rental.total_amount_due.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('ownerRentalDetailPage.labels.amountPaid')}</span>
                    <span className="text-sm font-medium">฿{(rental.final_amount_paid || 0).toLocaleString()}</span>
                  </div>
                  
                  {rental.owner_payout_amount && (
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-sm font-medium text-gray-900">{t('ownerRentalDetailPage.labels.yourPayout')}</span>
                      <span className="text-sm font-bold text-green-600">฿{rental.owner_payout_amount.toLocaleString()}</span>
                    </div>
                  )}
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Slip */}
          {Boolean(rental.payment_proof_url) && (
            <Card>
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment Slip</h2>
                <div className="my-2">
                  <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer">
                    <img src={rental.payment_proof_url!} alt="Payment Slip" className="max-w-xs rounded shadow border" />
                  </a>
                </div>
                <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View/Download Slip</a>
                {/* ปุ่มยืนยันการชำระเงิน */}
                {rental.payment_status === 'pending_verification' && (
                  <Button
                    onClick={handleVerifyPayment}
                    disabled={actionLoading}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading ? 'กำลังยืนยัน...' : 'ยืนยันการชำระเงิน'}
                  </Button>
                )}
                {/* ปุ่ม slip ไม่ถูกต้อง */}
                {(rental.payment_status === 'pending_verification' || rental.payment_status === 'paid') && (
                  <Button
                    onClick={() => setInvalidSlipDialogOpen(true)}
                    variant="danger"
                    className="mt-4 ml-2"
                  >
                    {t('ownerRentalDetailPage.invalidSlip.button')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Renter Notes */}
          {rental.notes_from_renter && (
            <Card>
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerRentalDetailPage.sections.renterNotes')}</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{rental.notes_from_renter}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {canApprove && (
            <Card>
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerRentalDetailPage.sections.actions')}</h2>
                
                <div className="flex space-x-4">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading ? 'Processing...' : t('ownerRentalDetailPage.actions.approveRequest')}
                  </Button>
                  
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {t('ownerRentalDetailPage.actions.rejectRequest')}
                  </Button>
            </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerRentalDetailPage.sections.timeline')}</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('ownerRentalDetailPage.timeline.created')}</span>
                  <span className="text-gray-900">{new Date(rental.created_at).toLocaleDateString()}</span>
                </div>
                
                {rental.actual_pickup_time && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('ownerRentalDetailPage.timeline.pickedUp')}</span>
                    <span className="text-gray-900">{new Date(rental.actual_pickup_time).toLocaleDateString()}</span>
                  </div>
                )}
                
                {rental.actual_return_time && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('ownerRentalDetailPage.timeline.returned')}</span>
                    <span className="text-gray-900">{new Date(rental.actual_return_time).toLocaleDateString()}</span>
                  </div>
                )}
                
                {rental.cancelled_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('ownerRentalDetailPage.timeline.cancelled')}</span>
                    <span className="text-gray-900">{new Date(rental.cancelled_at).toLocaleDateString()}</span>
                  </div>
                )}
                
                {rental.cancellation_reason && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{t('ownerRentalDetailPage.timeline.reason')}</span>
                    <p className="text-sm text-gray-600 mt-1">{rental.cancellation_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {canApprove && (
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading ? 'Processing...' : t('ownerRentalDetailPage.actions.approveRequest')}
                  </Button>
                  
                  <Button
                    onClick={() => setShowRejectForm(true)}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {t('ownerRentalDetailPage.actions.rejectRequest')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canProcessReturn && (
            <Card>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4a2 2 0 01-2 2H7a2 2 0 01-2-2V7m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m14 0H5" /></svg>
                  <h3 className="text-lg md:text-xl font-semibold text-indigo-700">{t('ownerRentalDetailPage.sections.returnProcessing', 'Return Processing')}</h3>
                </div>
                <p className="text-gray-600 mb-4 text-sm md:text-base">{t('ownerRentalDetailPage.sections.returnProcessingDesc', 'When the renter returns the item, please inspect and confirm the return here. This will update the rental status and notify the renter.')}</p>
                <Button
                  variant="primary"
                  className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {t('ownerRentalDetailPage.actions.processReturn', 'Process Return')}
                  </span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('ownerRentalDetailPage.actions.confirmReject')}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('ownerRentalDetailPage.actions.rejectReasonPlaceholder')}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={t('ownerRentalDetailPage.actions.rejectReasonPlaceholder')}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                }}
                variant="outline"
              >
                {t('ownerRentalDetailPage.actions.cancel')}
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? 'Processing...' : t('ownerRentalDetailPage.actions.confirmReject')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog slip ไม่ถูกต้อง */}
      {invalidSlipDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">{t('ownerRentalDetailPage.invalidSlip.title')}</h3>
            <p className="mb-4 text-gray-600">{t('ownerRentalDetailPage.invalidSlip.desc')}</p>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              value={invalidSlipReason}
              onChange={e => setInvalidSlipReason(e.target.value)}
              placeholder={t('ownerRentalDetailPage.invalidSlip.reasonPlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setInvalidSlipDialogOpen(false); setInvalidSlipReason(''); }}>{t('ownerRentalDetailPage.invalidSlip.cancel')}</Button>
              <Button variant="danger" disabled={!invalidSlipReason || invalidSlipLoading} onClick={handleMarkSlipInvalid} isLoading={invalidSlipLoading}>{t('ownerRentalDetailPage.invalidSlip.confirm')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
