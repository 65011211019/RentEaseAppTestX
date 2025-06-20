import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOwnerDashboardData } from '../../services/ownerService';
import { getOwnerRentals, approveRentalRequest, rejectRentalRequest } from '../../services/rentalService';
import { OwnerDashboardData } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
    <Card>
        <CardContent>
            <div className="flex items-center">
                {icon && <div className="mr-4 text-blue-500">{icon}</div>}
                <div>
                    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export const OwnerDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingRentalId, setRejectingRentalId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<{[id:number]:boolean}>({});
  const { showSuccess, showError } = useAlert();

  // For active menu highlighting
  const currentPath = window.location.pathname;

  useEffect(() => {
    if (!user?.id) {
      navigate(ROUTE_PATHS.LOGIN);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await getOwnerDashboardData(user.id);
        console.log('Dashboard response:', response);
        if (response.success && response.data) {
          console.log('Dashboard data:', response.data);
          setDashboardData(response.data);
        } else {
          console.log('Dashboard error:', response.message);
          setError(response.message || t('general.error'));
        }
      } catch (err) {
        const errorMessage = (err as Error).message;
        if (errorMessage === 'Authentication failed') {
          navigate(ROUTE_PATHS.LOGIN);
        } else {
          setError(errorMessage || t('general.error'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPendingRequests = async () => {
      setIsLoadingPending(true);
      try {
        const res = await getOwnerRentals({ status: 'pending_owner_approval', limit: 5 });
        setPendingRequests(res.data || []);
      } catch (e) {
        setPendingRequests([]);
      } finally {
        setIsLoadingPending(false);
      }
    };

    fetchDashboardData();
    fetchPendingRequests();
  }, [user, navigate, t]);

  // Quick Action Handlers
  const handleApprove = async (rentalId: number) => {
    setActionLoading((prev) => ({ ...prev, [rentalId]: true }));
    try {
      await approveRentalRequest(rentalId);
      showSuccess(t('ownerDashboardPage.quickActions.approveSuccess'));
      setPendingRequests((prev) => prev.filter((r) => r.id !== rentalId));
    } catch (e) {
      showError(t('ownerDashboardPage.quickActions.approveError'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [rentalId]: false }));
    }
  };
  const handleReject = (rentalId: number) => {
    setRejectingRentalId(rentalId);
    setRejectDialogOpen(true);
  };
  const confirmReject = async () => {
    if (!rejectingRentalId) return;
    setActionLoading((prev) => ({ ...prev, [rejectingRentalId]: true }));
    try {
      await rejectRentalRequest(rejectingRentalId, rejectReason);
      showSuccess(t('ownerDashboardPage.quickActions.rejectSuccess'));
      setPendingRequests((prev) => prev.filter((r) => r.id !== rejectingRentalId));
    } catch (e) {
      showError(t('ownerDashboardPage.quickActions.rejectError'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [rejectingRentalId!]: false }));
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectingRentalId(null);
    }
  };
  const handleChat = (rental: any) => {
    navigate(`/chat/${rental.renter?.id}`);
  };

  if (isLoading) return <LoadingSpinner message={t('navbar.loading')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!dashboardData) return <div className="p-4">{t('ownerDashboardPage.noData')}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 mb-8 md:mb-0">
          <nav className="bg-white rounded-lg shadow p-4 flex md:flex-col flex-row gap-2 md:gap-4">
            <Link to={ROUTE_PATHS.MY_LISTINGS} className={`px-4 py-2 rounded font-semibold text-left hover:bg-blue-50 transition ${currentPath === ROUTE_PATHS.MY_LISTINGS ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
              {t('ownerDashboardPage.sidebar.myListings')}
              <div className="text-xs text-gray-500 font-normal">{t('ownerDashboardPage.sidebar.myListingsDesc')}</div>
            </Link>
            <Link to={ROUTE_PATHS.OWNER_RENTAL_HISTORY} className={`px-4 py-2 rounded font-semibold text-left hover:bg-blue-50 transition ${currentPath === ROUTE_PATHS.OWNER_RENTAL_HISTORY ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
              {t('ownerDashboardPage.sidebar.rentalHistory')}
              <div className="text-xs text-gray-500 font-normal">{t('ownerDashboardPage.sidebar.rentalHistoryDesc')}</div>
            </Link>
            <Link to={ROUTE_PATHS.PAYOUT_INFO} className={`px-4 py-2 rounded font-semibold text-left hover:bg-blue-50 transition ${currentPath === ROUTE_PATHS.PAYOUT_INFO ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
              {t('ownerDashboardPage.sidebar.payoutInfo')}
              <div className="text-xs text-gray-500 font-normal">{t('ownerDashboardPage.sidebar.payoutInfoDesc')}</div>
            </Link>
            <Link to={ROUTE_PATHS.PROFILE} className={`px-4 py-2 rounded font-semibold text-left hover:bg-blue-50 transition ${currentPath === ROUTE_PATHS.PROFILE ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>
              {t('ownerDashboardPage.sidebar.profile')}
              <div className="text-xs text-gray-500 font-normal">{t('ownerDashboardPage.sidebar.profileDesc')}</div>
            </Link>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{t('ownerDashboardPage.title')}</h1>
            <Link to={ROUTE_PATHS.CREATE_PRODUCT}>
                <Button variant="primary">{t('ownerDashboardPage.addNewListing')}</Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard title={t('ownerDashboardPage.stats.totalListings')} value={dashboardData.total_my_products} />
            <StatCard title={t('ownerDashboardPage.stats.activeRentals')} value={dashboardData.active_rentals_count} />
            <StatCard title={t('ownerDashboardPage.stats.pendingRequests')} value={dashboardData.pending_rental_requests_count} />
            <StatCard title={t('ownerDashboardPage.stats.monthlyRevenue')} value={`฿${(dashboardData.estimated_monthly_revenue || 0).toLocaleString()}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Rental Requests */}
            <Card className="lg:col-span-2">
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">{t('ownerDashboardPage.pendingRequests.title')}</h2>
                  <Link to={ROUTE_PATHS.OWNER_RENTAL_HISTORY}>
                    <Button variant="outline" size="sm">{t('ownerDashboardPage.pendingRequests.viewAll')}</Button>
                  </Link>
                </div>
                {isLoadingPending ? (
                  <div className="text-gray-400 py-6">{t('ownerDashboardPage.pendingRequests.loading')}</div>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-gray-500">{t('ownerDashboardPage.pendingRequests.none')}</p>
                ) : (
                  <div className="divide-y">
                    {pendingRequests
                      .slice() // copy array
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((rental) => (
                        <div key={rental.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{rental.product?.title || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{t('ownerDashboardPage.rentalCard.renter')}: {rental.renter?.first_name || 'N/A'}</div>
                            <div className="text-xs text-gray-400">{t('ownerDashboardPage.rentalCard.dates')}: {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                            <Button size="sm" variant="primary" disabled={actionLoading[rental.id]} onClick={() => handleApprove(rental.id)}>{t('ownerDashboardPage.quickActions.approve')}</Button>
                            <Button size="sm" variant="danger" disabled={actionLoading[rental.id]} onClick={() => handleReject(rental.id)}>{t('ownerDashboardPage.quickActions.reject')}</Button>
                            <Button size="sm" variant="outline" onClick={() => handleChat(rental)}>{t('ownerDashboardPage.quickActions.chat')}</Button>
                            <Link to={`/owner/rentals/${rental.id}`}><Button size="sm" variant="outline">{t('ownerDashboardPage.quickActions.view')}</Button></Link>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions / Notifications */}
            <Card>
              <CardContent>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerDashboardPage.notifications.title')}</h2>
                <p className="text-gray-500">{t('ownerDashboardPage.notifications.none')}</p>
                <hr className="my-4"/>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('ownerDashboardPage.upcomingReturns.title')}</h2>
                <p className="text-gray-500">{t('ownerDashboardPage.upcomingReturns.none')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Reject Reason Dialog */}
          {rejectDialogOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-2">{t('ownerDashboardPage.quickActions.rejectDialogTitle')}</h3>
                <p className="mb-4 text-gray-600">{t('ownerDashboardPage.quickActions.rejectDialogDesc')}</p>
                <textarea
                  className="w-full border rounded p-2 mb-4"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder={t('ownerDashboardPage.quickActions.rejectReasonPlaceholder')}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectReason(''); setRejectingRentalId(null); }}>{t('ownerDashboardPage.quickActions.cancel')}</Button>
                  <Button variant="danger" disabled={!rejectReason || actionLoading[rejectingRentalId!]} onClick={confirmReject}>{t('ownerDashboardPage.quickActions.confirmReject')}</Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
