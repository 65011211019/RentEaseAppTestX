import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product, ApiError } from '../../types';
import { getProductByID } from '../../services/productService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { createRentalRequest } from '../../services/rentalService';
import { getUserAddresses } from '../../services/userService';
import { RentalPickupMethod, CreateRentalPayload, UserAddress } from '../../types';
import { InputField } from '../../components/ui/InputField';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { sendMessage } from '../../services/chatService';

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'} ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const LocationMarkerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block text-gray-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

export const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupMethod, setPickupMethod] = useState<RentalPickupMethod>(RentalPickupMethod.SELF_PICKUP);
  const [notes, setNotes] = useState('');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [contactingOwner, setContactingOwner] = useState(false);

  // Calculate tomorrow's date for min start date
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (!slugOrId) {
      setError(t('productDetailPage.missingProductId'));
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getProductByID(slugOrId);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          const primary = response.data.images.find(img => img.is_primary);
          setSelectedImage(primary ? primary.image_url : response.data.images[0].image_url);
        } else if (response.data.primary_image) {
             setSelectedImage(response.data.primary_image.image_url);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load product details.'); // Translate
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slugOrId, t]);

  useEffect(() => {
    if (showRentalModal && pickupMethod === RentalPickupMethod.DELIVERY && authUser) {
      setIsLoadingAddresses(true);
      getUserAddresses()
        .then(setAddresses)
        .catch(() => setAddresses([]))
        .finally(() => setIsLoadingAddresses(false));
    }
  }, [showRentalModal, pickupMethod, authUser]);

  const calculateRentalDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end > start) {
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      }
    }
    return 0;
  };
  const rentalDays = calculateRentalDays();
  const subtotal = product && rentalDays > 0 ? (product.rental_price_per_day || 0) * rentalDays : 0;
  const totalAmount = subtotal + (product?.security_deposit || 0);

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !product || rentalDays <= 0) {
      setFormError(t('productDetailPage.formInvalid'));
      return;
    }
    if (pickupMethod === RentalPickupMethod.DELIVERY && !selectedAddressId) {
      setFormError(t('productDetailPage.selectDeliveryAddress'));
      return;
    }
    // Validate start date must be in the future (at least tomorrow)
    if (new Date(startDate) < tomorrow) {
      setFormError(t('productDetailPage.startDateMustBeFuture'));
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    const payload: any = {
      product_id: product.id,
      start_date: startDate,
      end_date: endDate,
      pickup_method: pickupMethod,
    };
    if (pickupMethod === RentalPickupMethod.DELIVERY) {
      if (!selectedAddressId) {
        setFormError(t('productDetailPage.selectDeliveryAddress'));
        return;
      }
      payload.delivery_address_id = selectedAddressId;
    }
    if (notes) {
      payload.notes_from_renter = notes;
    }
    // Ensure no delivery_address_id for self_pickup
    if (pickupMethod === RentalPickupMethod.SELF_PICKUP && payload.delivery_address_id) {
      delete payload.delivery_address_id;
    }
    console.log('Rental payload:', payload);
    try {
      const newRental = await createRentalRequest(payload);
      console.log('newRental:', newRental);
      if (!newRental.id) {
        setFormError('Rental ID is missing from API response.');
        return;
      }
      setFormSuccess(t('productDetailPage.rentalRequestSuccess'));
      setShowRentalModal(false);
      navigate(ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(newRental.id)));
    } catch (err) {
      setFormError(
        (err as any)?.response?.data?.message ||
        (err as ApiError).message ||
        t('productDetailPage.rentalRequestFailed')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactOwner = async () => {
    if (!authUser || !product?.owner?.id) return;
    setContactingOwner(true);
    try {
      const productUrl = window.location.href;
      const messageText = t('productDetailPage.defaultContactMessage', { product: product.title }) + '\n' + productUrl;
      const msg = await sendMessage({
        receiver_id: product.owner.id,
        message_content: messageText,
        related_product_id: product.id
      });
      console.log('sendMessage result:', msg);
      if (msg && msg.conversation_id) {
        navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(msg.conversation_id)));
      } else {
        alert('No conversation_id returned from API. msg=' + JSON.stringify(msg));
      }
    } catch (err: any) {
      console.error('Contact owner error:', err);
      let msg = t('productDetailPage.contactOwnerError');
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      alert(msg);
    } finally {
      setContactingOwner(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t('productDetailPage.loadingDetails')} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} title={t('general.error')} />
        <div className="mt-4 text-center">
          <Button 
            variant="primary" 
            onClick={() => window.history.back()}
          >
            {t('general.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-10">{t('productDetailPage.productNotFound')}</div>;
  }
  
  const allImages = product.images || (product.primary_image ? [product.primary_image] : []);


  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="md:flex">
            {/* Image Gallery */}
            <div className="md:w-1/2 p-4">
              <div className="aspect-w-16 aspect-h-12 mb-4 rounded-lg overflow-hidden shadow">
                 {selectedImage ? (
                   <img 
                     src={selectedImage} 
                     alt={product.title} 
                     className="object-contain w-full h-full max-h-[500px]"
                   />
                 ) : (
                   <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                     <span className="text-gray-400">{t('productDetailPage.noImage')}</span>
                   </div>
                 )}
              </div>
              {allImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <button
                      key={img.id || index}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 focus:outline-none
                        ${selectedImage === img.image_url ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={img.image_url} alt={`${product.title} thumbnail ${index + 1}`} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.title}</h1>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < Math.round(product.average_rating || 0)} />
                  ))}
                </div>
                <span className="ml-2 text-gray-600 text-sm">{t('productDetailPage.reviewsCount', { count: product.total_reviews || 0 })}</span>
                <span className="mx-2 text-gray-400">|</span>
                <span className="text-sm text-gray-600">{t('productDetailPage.viewedCount', { count: product.view_count || 0 })}</span>
              </div>

              {product.category && (
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4">
                  {product.category.name}
                </span>
              )}
              
              <p className="text-gray-700 leading-relaxed mb-6">{product.description || "No description available."}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-700">฿{(product.rental_price_per_day ?? 0).toLocaleString()}</span>
                <span className="text-xl text-gray-500">{t('productCard.pricePerDay')}</span>
              </div>

              {product.rental_price_per_week && (
                <div className="mb-2">
                  <span className="text-lg font-semibold text-gray-700">฿{(product.rental_price_per_week ?? 0).toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">{t('productCard.pricePerWeek')}</span>
                </div>
              )}

              {product.rental_price_per_month && (
                <div className="mb-4">
                  <span className="text-lg font-semibold text-gray-700">฿{(product.rental_price_per_month ?? 0).toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">{t('productCard.pricePerMonth')}</span>
                </div>
              )}

              {product.security_deposit && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">{t('productDetailPage.securityDeposit')}: </span>
                  <span className="text-sm font-semibold text-gray-700">฿{(product.security_deposit ?? 0).toLocaleString()}</span>
                </div>
              )}

              {product.min_rental_duration_days && product.max_rental_duration_days && (
                <div className="mb-4">
                  <span className="text-sm text-gray-600">{t('productDetailPage.rentalDuration')}: </span>
                  <span className="text-sm font-semibold text-gray-700">
                    {product.min_rental_duration_days} - {product.max_rental_duration_days} {t('productDetailPage.days')}
                  </span>
                </div>
              )}

              {product.condition_notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('productDetailPage.conditionNotes')}</h3>
                  <p className="text-sm text-gray-600">{product.condition_notes}</p>
                </div>
              )}

              {product.address_details && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('productDetailPage.pickupLocation')}</h3>
                  <p className="text-sm text-gray-600">{product.address_details}</p>
                </div>
              )}

              {product.province && (
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                  <LocationMarkerIcon /> {t('productDetailPage.location', { locationName: product.province.name_th })}
                </p>
              )}

              {product.availability_status && (
                <p className={`text-sm font-medium mb-6 ${product.availability_status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {t('productDetailPage.statusLabel')} {product.availability_status.replace('_', ' ').toUpperCase()}
                </p>
              )}

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('productDetailPage.specificationsLabel')}</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key}><strong>{key}:</strong> {String(value)}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* ปุ่มเช่า/ขอเช่า/เพิ่ม wishlist เฉพาะถ้าไม่ใช่สินค้าของตัวเอง */}
              {product.owner?.id !== authUser?.id ? (
                <>
                  <Button size="lg" variant="primary" fullWidth className="mb-3" onClick={() => setShowRentalModal(true)}>
                    {t('productDetailPage.requestToRentButton')}
                  </Button>
                  <Button size="lg" variant="ghost" fullWidth>
                    {t('productDetailPage.addToWishlistButton')}
                  </Button>
                </>
              ) : (
                <div className="mb-6 text-center text-gray-400 text-base font-medium">{t('productDetailPage.thisIsYourOwnProduct', 'นี่คือสินค้าของคุณเอง')}</div>
              )}

              {product.owner && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('productDetailPage.ownerInfoLabel')}</h3>
                  <div className="flex items-center">
                    {product.owner.profile_picture_url ? (
                      <img 
                        src={product.owner.profile_picture_url} 
                        alt={product.owner.first_name || 'Owner'} 
                        className="w-16 h-16 rounded-full mr-4 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mr-4 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xl">
                          {(product.owner.first_name || 'O')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-medium text-gray-900">{product.owner.first_name}</p>
                      {product.owner.average_owner_rating !== undefined && product.owner.average_owner_rating !== null && (
                        <div className="flex items-center mt-1">
                           {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} filled={i < Math.round(product.owner?.average_owner_rating || 0)} className="h-4 w-4"/>
                          ))}
                           <span className="ml-1 text-xs text-gray-500">({product.owner.average_owner_rating.toFixed(1)})</span>
                        </div>
                      )}
                      {product.owner.created_at && <p className="text-xs text-gray-500">{t('productDetailPage.memberSince', { date: new Date(product.owner.created_at).toLocaleDateString() })}</p>}
                    </div>
                  </div>
                  {product.owner.id !== authUser?.id ? (
                    <Button variant="secondary" size="sm" className="mt-4" onClick={handleContactOwner} disabled={contactingOwner} isLoading={contactingOwner}>
                      {t('productDetailPage.contactOwnerButton')}
                    </Button>
                  ) : (
                    <div className="mt-4 text-sm text-gray-400">{t('productDetailPage.cannotChatWithOwnProduct', 'คุณไม่สามารถแชทกับสินค้าของตัวเองได้')}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rental Request Modal */}
      {showRentalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowRentalModal(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4">{t('productDetailPage.rentalRequestTitle')}</h2>
            {formError && <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />}
            {formSuccess && <div className="text-green-600 mb-2">{formSuccess}</div>}
            <form onSubmit={handleRentalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label={t('productDetailPage.startDateLabel')} type="date" name="start_date" value={startDate} onChange={e => setStartDate(e.target.value)} required min={tomorrowStr} />
                <InputField label={t('productDetailPage.endDateLabel')} type="date" name="end_date" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate || tomorrowStr} />
              </div>
              <div>
                <label htmlFor="pickup_method" className="block text-sm font-medium text-gray-700 mb-1">{t('productDetailPage.pickupMethodLabel')}</label>
                <select name="pickup_method" id="pickup_method" value={pickupMethod} onChange={e => setPickupMethod(e.target.value as RentalPickupMethod)} className="block w-full p-2 border rounded-md shadow-sm">
                  <option value={RentalPickupMethod.SELF_PICKUP}>{t('productDetailPage.selfPickupOption')}</option>
                  <option value={RentalPickupMethod.DELIVERY}>{t('productDetailPage.deliveryOption')}</option>
                </select>
              </div>
              {pickupMethod === RentalPickupMethod.DELIVERY && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('productDetailPage.deliveryAddressLabel')}</label>
                  {isLoadingAddresses ? (
                    <div>{t('productDetailPage.loadingAddresses')}</div>
                  ) : addresses.length > 0 ? (
                    <select value={selectedAddressId || ''} onChange={e => setSelectedAddressId(Number(e.target.value))} className="block w-full p-2 border rounded-md shadow-sm">
                      <option value="">{t('productDetailPage.selectAddressOption')}</option>
                      {addresses.map(addr => (
                        <option key={addr.id} value={addr.id}>{addr.recipient_name} - {addr.address_line1}, {addr.district}, {addr.province_name || addr.province_id}</option>
                      ))}
                    </select>
                  ) : (
                    <div>{t('productDetailPage.noAddressesFound')}</div>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">{t('productDetailPage.notesLabel')}</label>
                <textarea name="notes" id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="block w-full p-2 border rounded-md shadow-sm" placeholder={t('productDetailPage.notesPlaceholder')}></textarea>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span>{t('productDetailPage.rentalDaysLabel')}</span>
                  <span>{rentalDays > 0 ? rentalDays : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('productDetailPage.subtotalLabel')}</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                {product?.security_deposit && <div className="flex justify-between text-sm"><span>{t('productDetailPage.securityDeposit')}:</span><span>฿{product.security_deposit.toLocaleString()}</span></div>}
                <div className="flex justify-between text-base font-bold mt-2">
                  <span>{t('productDetailPage.totalAmountLabel')}</span>
                  <span>฿{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <Button type="submit" isLoading={isSubmitting} fullWidth variant="primary" size="lg" disabled={rentalDays <= 0}>
                {t('productDetailPage.submitRentalRequestButton')}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
