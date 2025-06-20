
import React, { useEffect, useState, FormEvent } from 'react';
// import { adminGetCategories, adminCreateCategory, adminUpdateCategory } from '../../services/adminService';
import { Category, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { getCategories } from '../../services/productService'; // Using public one for mock

// Mock admin services
const adminGetCategoriesMock = getCategories;
const adminCreateCategoryMock = async (payload: Omit<Category, 'id'>): Promise<Category> => {
    return new Promise(res => setTimeout(() => res({...payload, id: Math.random()}),300));
}

export const AdminManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id'>>({ name: '', slug: '', is_active: true });
  // TODO: Add state for editing existing category

  const fetchCategories = () => {
    setIsLoading(true);
    adminGetCategoriesMock()
      .then(res => setCategories(res.data))
      .catch(err => setError((err as ApiError).message || "Failed to load categories."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const {name, value, type} = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setNewCategory(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
  };

  const handleCreateCategory = async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(null);
      try {
          await adminCreateCategoryMock(newCategory);
          fetchCategories();
          setShowForm(false);
          setNewCategory({ name: '', slug: '', is_active: true });
      } catch(err) {
          setError("Failed to create category.");
      } finally {
          setIsSubmitting(false);
      }
  };


  if (isLoading && categories.length === 0) return <LoadingSpinner message="Loading categories..." />;
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Categories</h1>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      
      <Button onClick={() => setShowForm(prev => !prev)} variant={showForm ? "secondary" : "primary"} className="mb-6">
          {showForm ? 'Cancel Adding' : 'Add New Category'}
      </Button>

      {showForm && (
          <Card className="mb-8">
              <CardContent>
                  <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                      <InputField label="Name" name="name" value={newCategory.name} onChange={handleInputChange} required />
                      <InputField label="Slug" name="slug" value={newCategory.slug} onChange={handleInputChange} required />
                      {/* Add other fields like description, parent_id, icon_url, image_url, sort_order, is_featured */}
                      <div className="flex items-center">
                          <input type="checkbox" id="is_active" name="is_active" checked={newCategory.is_active} onChange={handleInputChange} className="h-4 w-4 text-blue-600"/>
                          <label htmlFor="is_active" className="ml-2">Active</label>
                      </div>
                      <Button type="submit" isLoading={isSubmitting}>Create Category</Button>
                  </form>
              </CardContent>
          </Card>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map(category => (
              <tr key={category.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{category.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{category.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{category.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button size="sm" variant="outline" onClick={() => alert("Edit TBD")}>Edit</Button>
                  {/* Delete button with confirmation */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
