import { Claim, ApiError, PaginatedResponse, ClaimType, ClaimStatus } from '../types';
import { MOCK_USER_ID } from '../constants';

export let mockClaimsDB: Claim[] = [
    {
        id: 1,
        rental_id: 1, // Assuming rental 1 was completed
        reported_by_id: 2, // Owner of product 1
        accused_id: MOCK_USER_ID + 1, // Renter of rental 1
        claim_type: ClaimType.DAMAGE,
        claim_details: "Screen has a scratch after rental.",
        requested_amount: 500,
        status: ClaimStatus.OPEN,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product_title: "High-Performance Laptop XL2000", // Denormalized for display
        reporter_name: "Jane D.",
        accused_name: "Renter User",
    }
];

export const getClaimsForUser = async (userId: number, params: { status?: string, page?:number, limit?:number }): Promise<PaginatedResponse<Claim>> => {
    return new Promise(resolve => {
        setTimeout(() => {
            let claims = mockClaimsDB.filter(c => c.reported_by_id === userId || c.accused_id === userId);
            
            if (params.status) {
                claims = claims.filter(c => c.status === params.status);
            }
            
            const page = params.page || 1;
            const limit = params.limit || 10;
            const total = claims.length;
            const paginatedData = claims.slice((page - 1) * limit, page * limit);
            
            resolve({ 
                data: paginatedData, 
                meta: { 
                    total, 
                    current_page: page, 
                    per_page: limit, 
                    last_page: Math.ceil(total/limit), 
                    from: (page-1)*limit + 1, 
                    to: Math.min(page*limit, total) 
                } 
            });
        }, 500);
    });
};

export const getClaimDetails = async (claimId: number, userId: number): Promise<Claim> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const claim = mockClaimsDB.find(c => c.id === claimId);
            if (claim && (claim.reported_by_id === userId || claim.accused_id === userId /*|| userIsAdmin*/)) {
                resolve(claim);
            } else {
                reject({ message: "Claim not found or access denied", status: 404 } as ApiError);
            }
        }, 300);
    });
};

// Placeholder for other claim actions (create, respond, update status by admin etc.)
// POST /api/claims
// PUT /api/claims/{claim_id} (Admin or owner to update)
// POST /api/claims/{claim_id}/respond (Renter responds)