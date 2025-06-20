
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { adminGetStaticPages, adminUpdateStaticPage } from '../../services/adminService'; // Assuming these exist
import { StaticPageContent, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants'; // For linking to public view

// Mock
const adminGetStaticPagesMock = async (): Promise<StaticPageContent[]> => {
    return new Promise(res => setTimeout(() => res([
        { slug: 'about-us', title: 'About Us', content_html: '<p>About content...</p>', updated_at: new Date().toISOString(), is_published: true },
        { slug: 'terms-of-service', title: 'Terms of Service', content_html: '<p>Terms content...</p>', updated_at: new Date().toISOString(), is_published: true },
    ]), 300));
}


export const AdminManageStaticContentPage: React.FC = () => {
  const [pages, setPages] = useState<StaticPageContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Add state for editing a specific page

  const fetchStaticPages = () => {
    setIsLoading(true);
    adminGetStaticPagesMock() // Replace with actual service call
      .then(setPages)
      .catch(err => setError((err as ApiError).message || "Failed to load static pages."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStaticPages();
  }, []);

  if (isLoading) return <LoadingSpinner message="Loading static content..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Manage Static Content (CMS)</h1>
      {/* TODO: Button to create new static page */}
      
      <div className="space-y-4">
        {pages.map(page => (
          <Card key={page.slug}>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">{page.title}</h2>
                  <p className="text-sm text-gray-500">Slug: /{page.slug}</p>
                  <p className="text-xs text-gray-400">Last Updated: {new Date(page.updated_at).toLocaleString()}</p>
                </div>
                <div className="space-x-2">
                    <Link to={`/${page.slug}`} target="_blank"> {/* Simplified link, map from ROUTE_PATHS if possible */}
                        <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => alert(`Edit page: ${page.title} - TBD`)}>
                        Edit
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* TODO: Form for editing selected page (e.g. in a modal or separate section) */}
    </div>
  );
};
