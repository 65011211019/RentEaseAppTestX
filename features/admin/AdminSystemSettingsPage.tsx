
import React, { useEffect, useState, FormEvent } from 'react';
import { adminGetSystemSettings } from '../../services/adminService'; // Assuming this exists
import { ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';

interface SystemSettings {
    site_name: string;
    maintenance_mode: boolean;
    default_platform_fee_owner?: number; // Percentage
    default_platform_fee_renter?: number; // Percentage
    // Add more settings as needed
}

// Mock service call
const adminGetSystemSettingsMock = async (): Promise<SystemSettings> => {
    return new Promise(res => setTimeout(() => res({
        site_name: "RentEase - The Best Rentals",
        maintenance_mode: false,
        default_platform_fee_owner: 5.0,
        default_platform_fee_renter: 2.5
    }), 300));
}
const adminUpdateSystemSettingsMock = async (settings: SystemSettings): Promise<SystemSettings> => {
     return new Promise(res => setTimeout(() => { console.log("Settings updated:", settings); res(settings); }, 500));
}


export const AdminSystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    adminGetSystemSettingsMock() // Replace with actual service call
      .then(setSettings)
      .catch(err => setError((err as ApiError).message || "Failed to load system settings."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => prev ? ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
        await adminUpdateSystemSettingsMock(settings); // Replace with actual service call
        setSuccessMessage("System settings updated successfully!");
    } catch (err) {
        setError((err as ApiError).message || "Failed to update settings.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || !settings) return <LoadingSpinner message="Loading system settings..." />;
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">System Settings</h1>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField 
                label="Site Name" 
                name="site_name" 
                value={settings.site_name} 
                onChange={handleChange} 
            />
            <div className="flex items-center">
                <input 
                    type="checkbox" 
                    id="maintenance_mode" 
                    name="maintenance_mode" 
                    checked={settings.maintenance_mode} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="maintenance_mode" className="ml-2 block text-sm text-gray-900">
                    Enable Maintenance Mode
                </label>
            </div>
            <InputField 
                label="Platform Fee for Owners (%)" 
                name="default_platform_fee_owner"
                type="number" 
                value={settings.default_platform_fee_owner || ''} 
                onChange={handleChange} 
                step="0.1"
            />
            <InputField 
                label="Platform Fee for Renters (%)" 
                name="default_platform_fee_renter"
                type="number" 
                value={settings.default_platform_fee_renter || ''} 
                onChange={handleChange} 
                step="0.1"
            />
            
            {/* Add more settings fields here */}

            <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg">
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
