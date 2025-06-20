import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';

import { HomePage } from './features/products/HomePage';
import { ProductDetailPage } from './features/products/ProductDetailPage';
import { SearchPage } from './features/products/SearchPage';

import { UserProfilePage } from './features/user/UserProfilePage';
import UserIdVerificationPage from './features/user/UserIdVerificationPage';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { ROUTE_PATHS } from './constants';

// Owner features
import { OwnerDashboardPage } from './features/owner/OwnerDashboardPage';
import { MyListingsPage } from './features/owner/MyListingsPage';
import { ProductFormPage } from './features/owner/ProductFormPage';
import { OwnerRentalHistoryPage } from './features/owner/OwnerRentalHistoryPage';
import { OwnerRentalDetailPage } from './features/owner/OwnerRentalDetailPage';
import { PayoutInfoPage } from './features/owner/PayoutInfoPage';
import { ReportReturnPage } from './features/owner/ReportReturnPage';

// Renter features
import { RenterDashboardPage } from './features/renter/RenterDashboardPage';
import { MyRentalsPage } from './features/renter/MyRentalsPage';
import { RentalCheckoutPage } from './features/renter/RentalCheckoutPage';
import { PaymentPage } from './features/renter/PaymentPage';
import { RenterRentalDetailPage } from './features/renter/RenterRentalDetailPage';
import { SubmitReviewPage } from './features/renter/SubmitReviewPage';

// Chat features
import { ChatInboxPage } from './features/chat/ChatInboxPage';
import { ChatRoomPage } from './features/chat/ChatRoomPage';

// Claims features
import { ClaimsHistoryPage } from './features/claims/ClaimsHistoryPage';
import { ClaimDetailPage } from './features/claims/ClaimDetailPage';
import { ClaimManagementPage } from './features/claims/ClaimManagementPage';

// Complaints features
import { SubmitComplaintPage } from './features/complaints/SubmitComplaintPage';
import { MyComplaintsPage } from './features/complaints/MyComplaintsPage';

// Static pages
import { StaticPage } from './features/static/StaticPage';
import { FaqPage } from './features/static/FaqPage';
import { ContactUsPage } from './features/static/ContactUsPage';

// Admin features
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { AdminManageUsersPage } from './features/admin/AdminManageUsersPage';
import { AdminUserDetailPage } from './features/admin/AdminUserDetailPage';
import { AdminManageProductsPage } from './features/admin/AdminManageProductsPage';
import { AdminProductDetailPage } from './features/admin/AdminProductDetailPage';
import { AdminManageRentalsPage } from './features/admin/AdminManageRentalsPage';
import { AdminRentalDetailPage } from './features/admin/AdminRentalDetailPage';
import { AdminManageCategoriesPage } from './features/admin/AdminManageCategoriesPage';
import { AdminSystemSettingsPage } from './features/admin/AdminSystemSettingsPage';
import { AdminManageStaticContentPage } from './features/admin/AdminManageStaticContentPage';
import { AdminReportsPage } from './features/admin/AdminReportsPage';
import { AdminManageClaimsPage } from './features/admin/AdminManageClaimsPage';
import { AdminClaimDetailPage } from './features/admin/AdminClaimDetailPage';
import { AdminManageComplaintsPage } from './features/admin/AdminManageComplaintsPage';
import { AdminComplaintDetailPage } from './features/admin/AdminComplaintDetailPage';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AlertProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow bg-gray-100">
              <Routes>
                {/* Public Routes */}
                <Route path={ROUTE_PATHS.HOME} element={<HomePage />} />
                <Route path={ROUTE_PATHS.LOGIN} element={<LoginPage />} />
                <Route path={ROUTE_PATHS.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTE_PATHS.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
                <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
                <Route path={ROUTE_PATHS.PRODUCT_DETAIL} element={<ProductDetailPage />} />
                <Route path={ROUTE_PATHS.SEARCH_PRODUCTS} element={<SearchPage />} />
                
                <Route path={ROUTE_PATHS.ABOUT_US} element={<StaticPage pageSlug="about-us" />} />
                <Route path={ROUTE_PATHS.TERMS_OF_SERVICE} element={<StaticPage pageSlug="terms-of-service" />} />
                <Route path={ROUTE_PATHS.PRIVACY_POLICY} element={<StaticPage pageSlug="privacy-policy" />} />
                <Route path={ROUTE_PATHS.FAQ} element={<FaqPage />} />
                <Route path={ROUTE_PATHS.CONTACT_US} element={<ContactUsPage />} />
                
                {/* Protected Routes (User must be logged in) */}
                <Route element={<ProtectedRoute />}>
                  <Route path={ROUTE_PATHS.PROFILE} element={<UserProfilePage />} />
                  <Route path={ROUTE_PATHS.ID_VERIFICATION} element={<UserIdVerificationPage />} />
                  
                  {/* Owner Routes */}
                  <Route path={ROUTE_PATHS.OWNER_DASHBOARD} element={<OwnerDashboardPage />} />
                  <Route path={ROUTE_PATHS.MY_LISTINGS} element={<MyListingsPage />} />
                  <Route path={ROUTE_PATHS.CREATE_PRODUCT} element={<ProductFormPage />} />
                  <Route path={ROUTE_PATHS.EDIT_PRODUCT} element={<ProductFormPage />} />
                  <Route path={ROUTE_PATHS.OWNER_RENTAL_HISTORY} element={<OwnerRentalHistoryPage />} />
                  <Route path={ROUTE_PATHS.OWNER_RENTAL_DETAIL} element={<OwnerRentalDetailPage />} />
                  <Route path={ROUTE_PATHS.PAYOUT_INFO} element={<PayoutInfoPage />} />
                  <Route path={ROUTE_PATHS.OWNER_REPORT_RETURN} element={<ReportReturnPage />} />

                  {/* Renter Routes */}
                  <Route path={ROUTE_PATHS.RENTER_DASHBOARD} element={<RenterDashboardPage />} />
                  <Route path={ROUTE_PATHS.MY_RENTALS_RENTER} element={<MyRentalsPage />} />
                  <Route path={ROUTE_PATHS.RENTAL_CHECKOUT_PAGE} element={<RentalCheckoutPage />} />
                  <Route path={ROUTE_PATHS.PAYMENT_PAGE} element={<PaymentPage />} /> 
                  <Route path={ROUTE_PATHS.RENTER_RENTAL_DETAIL} element={<RenterRentalDetailPage />} />
                  <Route path={ROUTE_PATHS.SUBMIT_REVIEW} element={<SubmitReviewPage />} />

                  {/* Shared Protected Routes */}
                  <Route path={ROUTE_PATHS.CHAT_INBOX} element={<ChatInboxPage />} />
                  <Route path={ROUTE_PATHS.CHAT_ROOM} element={<ChatRoomPage />} />
                  <Route path={ROUTE_PATHS.CLAIMS_HISTORY} element={<ClaimsHistoryPage />} />
                  <Route path={ROUTE_PATHS.CLAIM_DETAIL} element={<ClaimDetailPage />} />
                  <Route path={ROUTE_PATHS.CLAIM_MANAGEMENT} element={<ClaimManagementPage />} />
                  <Route path={ROUTE_PATHS.SUBMIT_COMPLAINT} element={<SubmitComplaintPage />} />
                  <Route path={ROUTE_PATHS.MY_COMPLAINTS} element={<MyComplaintsPage />} />
                </Route>

                {/* Admin Routes (User must be logged in AND be an admin) */}
                <Route element={<AdminRoute />}>
                  <Route path={ROUTE_PATHS.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_USERS} element={<AdminManageUsersPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_USER_DETAIL} element={<AdminUserDetailPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS} element={<AdminManageProductsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_PRODUCT_DETAIL} element={<AdminProductDetailPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_RENTALS} element={<AdminManageRentalsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_RENTAL_DETAIL} element={<AdminRentalDetailPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES} element={<AdminManageCategoriesPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_SYSTEM_SETTINGS} element={<AdminSystemSettingsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_STATIC_CONTENT} element={<AdminManageStaticContentPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_REPORTS} element={<AdminReportsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_CLAIMS} element={<AdminManageClaimsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_CLAIM_DETAIL} element={<AdminClaimDetailPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_MANAGE_COMPLAINTS} element={<AdminManageComplaintsPage />} />
                  <Route path={ROUTE_PATHS.ADMIN_COMPLAINT_DETAIL} element={<AdminComplaintDetailPage />} />
                </Route>
                
                <Route path="*" element={<Navigate to={ROUTE_PATHS.HOME} replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AlertProvider>
    </AuthProvider>
  );
};

export default App;
