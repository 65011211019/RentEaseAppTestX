import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { adminGetProductById, adminUpdateProduct } from '../../services/adminService'; // Assuming these exist
import { Product, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { getProductByID } from '../../services/productService'; // Can use public one for viewing


export const AdminProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      setIsLoading(true);
      getProductByID(Number(productId)) // Using public getter for now
        .then(response => setProduct(response.data))
        .catch(err => setError((err as ApiError).message || "Failed to load product details."))
        .finally(() => setIsLoading(false));
    }
  }, [productId]);

  if (isLoading) return <LoadingSpinner message="Loading product details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!product) return <div className="p-4 text-center">Product not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS} className="text-blue-600 hover:underline mb-6 block">&larr; Back to All Products</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin View: {product.title}</h1>
      
      <Card className="mb-6">
        <CardContent>
            <h2 className="text-xl font-semibold mb-3">Product Information</h2>
            <p><strong>Owner ID:</strong> {product.owner_id}</p>
            <p><strong>Category:</strong> {product.category?.name || product.category_id}</p>
            <p><strong>Province:</strong> {product.province?.name_th || product.province_id}</p>
            <p><strong>Price/Day:</strong> ฿{product.rental_price_per_day.toLocaleString()}</p>
            <p><strong>Availability:</strong> {product.availability_status?.toUpperCase()}</p>
            <p><strong>Admin Approval:</strong> {product.admin_approval_status?.toUpperCase()}</p>
            <p><strong>Description:</strong> {product.description || "N/A"}</p>
        </CardContent>
      </Card>
      
      {/* TODO: Add forms for admin editing product details, approval status etc. */}
       <Card>
          <CardContent>
              <h2 className="text-xl font-semibold mb-3">Admin Actions</h2>
              <p className="italic text-gray-500">Product editing and approval forms will appear here. (Coming Soon)</p>
               {/* Example:
                <select defaultValue={product.admin_approval_status}>...</select>
                <Button>Save Changes</Button>
               */}
          </CardContent>
      </Card>
    </div>
  );
};
