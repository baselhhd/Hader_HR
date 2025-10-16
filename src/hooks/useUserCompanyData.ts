/**
 * Hook to fetch user's company, branch, and location data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSession } from '@/lib/auth';

interface UserCompanyData {
  companyId: string | null;
  branchId: string | null;
  locationId: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationRadius: number | null;
  shiftId: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useUserCompanyData(): UserCompanyData {
  const [data, setData] = useState<UserCompanyData>({
    companyId: null,
    branchId: null,
    locationId: null,
    locationName: null,
    locationLat: null,
    locationLng: null,
    locationRadius: null,
    shiftId: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Get user from local session
        const session = getSession();
        if (!session) {
          throw new Error('No authenticated user');
        }

        // Get user profile
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('company_id, branch_id')
          .eq('id', session.userId)
          .single();

        if (userError) throw userError;

        // Get employee data with location info
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select(`
            location_id,
            shift_id,
            locations:location_id (
              id,
              name,
              lat,
              lng,
              gps_radius
            )
          `)
          .eq('user_id', session.userId)
          .maybeSingle();

        if (employeeError && employeeError.code !== 'PGRST116') {
          throw employeeError;
        }

        const location = employee?.locations as any;

        setData({
          companyId: userProfile?.company_id || null,
          branchId: userProfile?.branch_id || null,
          locationId: employee?.location_id || null,
          locationName: location?.name || null,
          locationLat: location?.lat || null,
          locationLng: location?.lng || null,
          locationRadius: location?.gps_radius || 100,
          shiftId: employee?.shift_id || null,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching user company data:', error);
        setData({
          companyId: null,
          branchId: null,
          locationId: null,
          locationName: null,
          locationLat: null,
          locationLng: null,
          locationRadius: null,
          shiftId: null,
          isLoading: false,
          error: error as Error,
        });
      }
    }

    fetchData();
  }, []);

  return data;
}
