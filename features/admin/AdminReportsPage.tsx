
import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';

export const AdminReportsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Reports & Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">User Registrations</h2>
            <p className="text-gray-600">Chart/data for user sign-ups over time. (Coming Soon)</p>
            {/* Placeholder for chart */}
            <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center mt-4">
                <span className="text-gray-500">User Registrations Chart</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Rental Trends</h2>
            <p className="text-gray-600">Chart/data for rental volume, popular items. (Coming Soon)</p>
            <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center mt-4">
                <span className="text-gray-500">Rental Trends Chart</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Revenue Reports</h2>
            <p className="text-gray-600">Platform fees, payout summaries. (Coming Soon)</p>
             <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center mt-4">
                <span className="text-gray-500">Revenue Chart</span>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Content Engagement</h2>
            <p className="text-gray-600">Product views, search queries. (Coming Soon)</p>
             <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center mt-4">
                <span className="text-gray-500">Engagement Metrics</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
