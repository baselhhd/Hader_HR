import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyInfo {
  id: string;
  name: string;
}

export interface BranchInfo {
  id: string;
  name: string;
}

export interface LocationInfo {
  id: string;
  name: string;
}

export interface UserLocationData {
  company: CompanyInfo | null;
  branch: BranchInfo | null;
  location: LocationInfo | null;
  locations: LocationInfo[]; // For managers with multiple locations
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch complete user location information
 * including company, branch, and location(s)
 */
export const useUserLocationInfo = (userId: string, userRole: string) => {
  const [data, setData] = useState<UserLocationData>({
    company: null,
    branch: null,
    location: null,
    locations: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) return;

    fetchUserLocationInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userRole]);

  const fetchUserLocationInfo = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Get user's basic info (company_id, branch_id)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(`
          company_id,
          branch_id,
          companies:company_id (id, name),
          branches:branch_id (id, name)
        `)
        .eq("id", userId)
        .single();

      if (userError) throw userError;

      const companyInfo = userData?.companies ? {
        id: userData.companies.id,
        name: userData.companies.name
      } : null;

      const branchInfo = userData?.branches ? {
        id: userData.branches.id,
        name: userData.branches.name
      } : null;

      // 2. Get location info based on role
      if (userRole === "employee") {
        // For employees, get location from employees table
        const { data: empData, error: empError } = await supabase
          .from("employees")
          .select(`
            location_id,
            locations:location_id (id, name)
          `)
          .eq("user_id", userId)
          .single();

        if (empError && empError.code !== 'PGRST116') throw empError; // Ignore "not found" error

        const locationInfo = empData?.locations ? {
          id: empData.locations.id,
          name: empData.locations.name
        } : null;

        setData({
          company: companyInfo,
          branch: branchInfo,
          location: locationInfo,
          locations: locationInfo ? [locationInfo] : [],
          isLoading: false,
          error: null,
        });

      } else if (userRole === "manager" || userRole === "loc_manager") {
        // For managers, get all locations from location_managers table
        const { data: managerData, error: managerError } = await supabase
          .from("location_managers")
          .select(`
            location_id,
            locations:location_id (id, name)
          `)
          .eq("user_id", userId);

        if (managerError) throw managerError;

        const locationsArray: LocationInfo[] = (managerData || [])
          .filter(item => item.locations)
          .map(item => ({
            id: item.locations!.id,
            name: item.locations!.name
          }));

        // Primary location is the first one
        const primaryLocation = locationsArray.length > 0 ? locationsArray[0] : null;

        setData({
          company: companyInfo,
          branch: branchInfo,
          location: primaryLocation,
          locations: locationsArray,
          isLoading: false,
          error: null,
        });

      } else {
        // For admins, HR, etc. - just company and branch
        setData({
          company: companyInfo,
          branch: branchInfo,
          location: null,
          locations: [],
          isLoading: false,
          error: null,
        });
      }

    } catch (error) {
      console.error("Error fetching user location info:", error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "خطأ في تحميل البيانات"
      }));
    }
  };

  return data;
};
