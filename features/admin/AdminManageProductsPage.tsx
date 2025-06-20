
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminApproveProduct } from '../../services/adminService';
import { Product, ApiError, PaginatedResponse, ProductAdminApprovalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';

export const AdminManageProductsPage: React.FC = () => {
  const [productsResponse, setProductsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = (page = 1) => {
    setIsLoading(true);
    adminGetProducts({ page })
      .then(setProductsResponse)
      .catch(err => setError((err as ApiError).message || "Failed to load products."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApproval = async (productId: number, status: ProductAdminApprovalStatus) => {
      // Add confirmation
      try {
          await adminApproveProduct(productId, status);
          fetchProducts(productsResponse?.meta.current_page || 1);
      } catch(err) {
          setError("Failed to update product approval status.");
      }
  };

  if (isLoading && !productsResponse) return <LoadingSpinner message="Loading products..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Products</h1>
      {/* TODO: Search and filter controls */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productsResponse?.data.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.owner_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿{product.rental_price_per_day}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.admin_approval_status === ProductAdminApprovalStatus.APPROVED ? 'bg-green-100 text-green-800' :
                        product.admin_approval_status === ProductAdminApprovalStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                        {product.admin_approval_status}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <Link to={ROUTE_PATHS.ADMIN_PRODUCT_DETAIL.replace(':productId', String(product.id))} className="text-blue-600 hover:text-blue-900">View/Edit</Link>
                  {product.admin_approval_status === ProductAdminApprovalStatus.PENDING && (
                      <>
                        <Button onClick={() => handleApproval(product.id, ProductAdminApprovalStatus.APPROVED)} size="sm" variant="primary">Approve</Button>
                        <Button onClick={() => handleApproval(product.id, ProductAdminApprovalStatus.REJECTED)} size="sm" variant="danger">Reject</Button>
                      </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* TODO: Pagination Controls */}
    </div>
  );
};
