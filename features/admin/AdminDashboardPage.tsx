
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

const AdminFeatureCard: React.FC<{ title: string; description: string; linkTo: string }> = ({ title, description, linkTo }) => (
    <Link to={linkTo} className="block hover:shadow-lg transition-shadow rounded-lg">
        <Card>
            <CardContent>
                <h3 className="text-xl font-semibold text-blue-600 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </CardContent>
        </Card>
    </Link>
);

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-10 text-center">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminFeatureCard title="User Management" description="View, edit, and manage user accounts." linkTo={ROUTE_PATHS.ADMIN_MANAGE_USERS} />
        <AdminFeatureCard title="Product Management" description="Approve, edit, or remove product listings." linkTo={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS} />
        <AdminFeatureCard title="Rental Management" description="Oversee rental transactions and statuses." linkTo={ROUTE_PATHS.ADMIN_MANAGE_RENTALS} />
        <AdminFeatureCard title="Category Management" description="Add, edit, or remove product categories." linkTo={ROUTE_PATHS.ADMIN_MANAGE_CATEGORIES} />
        <AdminFeatureCard title="Claims Management" description="Review and mediate user claims." linkTo={ROUTE_PATHS.ADMIN_MANAGE_CLAIMS} />
        <AdminFeatureCard title="Complaints System" description="Address and resolve user complaints." linkTo={ROUTE_PATHS.ADMIN_MANAGE_COMPLAINTS} />
        <AdminFeatureCard title="Static Content (CMS)" description="Manage pages like About Us, FAQ, Terms." linkTo={ROUTE_PATHS.ADMIN_MANAGE_STATIC_CONTENT} />
        <AdminFeatureCard title="System Settings" description="Configure platform-wide settings." linkTo={ROUTE_PATHS.ADMIN_SYSTEM_SETTINGS} />
        <AdminFeatureCard title="Reports & Analytics" description="View platform usage statistics and reports." linkTo={ROUTE_PATHS.ADMIN_REPORTS} />
      </div>
      {/* Placeholder for dashboard stats/charts */}
      <div className="mt-12 p-6 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Platform Overview</h2>
        <p className="text-gray-600">Detailed statistics and charts will be displayed here. (Coming Soon)</p>
      </div>
    </div>
  );
};
