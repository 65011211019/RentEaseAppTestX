
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, reportReturnByOwner } from '../../services/rentalService';
import { Rental, ApiError, RentalReturnConditionStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';


interface ReturnFormData {
    actual_return_time: string;
    return_condition_status: RentalReturnConditionStatus;
    notes_from_owner_on_return?: string;
    initiate_claim: boolean;
    // condition_images?: FileList | null; // For future image uploads
}

export const ReportReturnPage: React.FC = () => {
    const { rentalId } = useParams<{ rentalId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [rental, setRental] = useState<Rental | null>(null);
    const [formData, setFormData] = useState<ReturnFormData>({
        actual_return_time: new Date().toISOString().slice(0, 16), // Default to now, datetime-local format
        return_condition_status: RentalReturnConditionStatus.GOOD,
        initiate_claim: false,
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id && rentalId) {
            setIsLoading(true);
            getRentalDetails(rentalId, user.id, 'owner')
                .then(setRental)
                .catch(err => setError((err as ApiError).message || "Failed to load rental details."))
                .finally(() => setIsLoading(false));
        }
    }, [rentalId, user]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user?.id || !rentalId || !rental) return;

        setIsSubmitting(true);
        setError(null);
        try {
            await reportReturnByOwner(rental.id, user.id, formData);
            // alert("Return processed successfully!"); // Replace with better notification
            navigate(ROUTE_PATHS.OWNER_RENTAL_DETAIL.replace(':rentalId', rentalId));
        } catch (err) {
            setError((err as ApiError).message || "Failed to process return.");
        } finally {
            setIsSubmitting(false);
        }
    };


    if (isLoading) return <LoadingSpinner message="Loading rental for return processing..." />;
    if (error) return <ErrorMessage message={error} />;
    if (!rental) return <div className="p-4 text-center">Rental not found or not accessible.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Report Item Return</h1>
            <p className="mb-2">Processing return for Rental ID: <strong>{rental.rental_uid.substring(0,8)}...</strong></p>
            <p className="mb-6">Product: <strong>{rental.product?.title}</strong></p>

            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField
                            label="Actual Return Date & Time"
                            name="actual_return_time"
                            type="datetime-local"
                            value={formData.actual_return_time}
                            onChange={handleChange}
                            required
                        />
                        <div>
                            <label htmlFor="return_condition_status" className="block text-sm font-medium text-gray-700 mb-1">Item Condition on Return</label>
                            <select 
                                name="return_condition_status" 
                                id="return_condition_status"
                                value={formData.return_condition_status} 
                                onChange={handleChange}
                                required
                                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Object.values(RentalReturnConditionStatus).map(status => (
                                    <option key={status} value={status}>{status.replace(/_/g, ' ').toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="notes_from_owner_on_return" className="block text-sm font-medium text-gray-700 mb-1">Notes on Return (Optional)</label>
                            <textarea 
                                name="notes_from_owner_on_return" 
                                id="notes_from_owner_on_return"
                                value={formData.notes_from_owner_on_return || ''} 
                                onChange={handleChange}
                                rows={3}
                                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Item returned clean, minor scratch on top."
                            />
                        </div>
                        
                        {/* Future: Image Uploads for condition */}

                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="initiate_claim" 
                                name="initiate_claim" 
                                checked={formData.initiate_claim} 
                                onChange={handleChange} 
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="initiate_claim" className="ml-2 block text-sm text-gray-900">
                                Initiate a Claim for Damages/Issues? (This will mark the rental as 'Disputed')
                            </label>
                        </div>
                        
                        <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg">
                            Confirm Return Processed
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
