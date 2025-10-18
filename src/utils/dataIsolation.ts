/**
 * Data Isolation Utilities
 *
 * هذه الملف يحتوي على دوال مساعدة لتطبيق استقلالية البيانات بين الشركات
 * كل شركة يجب أن ترى بياناتها فقط ولا تستطيع الوصول لبيانات الشركات الأخرى
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * الحصول على company_id للمستخدم الحالي
 * @param userId - معرف المستخدم
 * @returns company_id أو null إذا لم يتم العثور عليه
 */
export const getCurrentUserCompanyId = async (
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user company_id:", error);
      return null;
    }

    return data?.company_id || null;
  } catch (error) {
    console.error("Error in getCurrentUserCompanyId:", error);
    return null;
  }
};

/**
 * الحصول على branch_id للمستخدم الحالي
 * @param userId - معرف المستخدم
 * @returns branch_id أو null إذا لم يتم العثور عليه
 */
export const getCurrentUserBranchId = async (
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("branch_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user branch_id:", error);
      return null;
    }

    return data?.branch_id || null;
  } catch (error) {
    console.error("Error in getCurrentUserBranchId:", error);
    return null;
  }
};

/**
 * الحصول على معلومات الشركة والفرع معاً
 * @param userId - معرف المستخدم
 * @returns كائن يحتوي على company_id و branch_id
 */
export const getCurrentUserCompanyAndBranch = async (
  userId: string
): Promise<{ companyId: string | null; branchId: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("company_id, branch_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user company and branch:", error);
      return { companyId: null, branchId: null };
    }

    return {
      companyId: data?.company_id || null,
      branchId: data?.branch_id || null,
    };
  } catch (error) {
    console.error("Error in getCurrentUserCompanyAndBranch:", error);
    return { companyId: null, branchId: null };
  }
};

/**
 * الحصول على جميع location_ids التي يديرها المدير
 * @param userId - معرف المدير
 * @returns مصفوفة من location_ids
 */
export const getManagerLocationIds = async (
  userId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("location_managers")
      .select("location_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching manager locations:", error);
      return [];
    }

    return (data || []).map((item) => item.location_id);
  } catch (error) {
    console.error("Error in getManagerLocationIds:", error);
    return [];
  }
};

/**
 * الحصول على جميع location_ids التابعة لشركة معينة
 * @param companyId - معرف الشركة
 * @returns مصفوفة من location_ids
 */
export const getCompanyLocationIds = async (
  companyId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("id")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error fetching company locations:", error);
      return [];
    }

    return (data || []).map((item) => item.id);
  } catch (error) {
    console.error("Error in getCompanyLocationIds:", error);
    return [];
  }
};

/**
 * الحصول على جميع branch_ids التابعة لشركة معينة
 * @param companyId - معرف الشركة
 * @returns مصفوفة من branch_ids
 */
export const getCompanyBranchIds = async (
  companyId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select("id")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error fetching company branches:", error);
      return [];
    }

    return (data || []).map((item) => item.id);
  } catch (error) {
    console.error("Error in getCompanyBranchIds:", error);
    return [];
  }
};

/**
 * التحقق من أن المستخدم ينتمي لنفس الشركة
 * @param userId - معرف المستخدم المراد التحقق منه
 * @param currentUserCompanyId - معرف شركة المستخدم الحالي
 * @returns true إذا كان المستخدم ينتمي لنفس الشركة
 */
export const isUserInSameCompany = async (
  userId: string,
  currentUserCompanyId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking user company:", error);
      return false;
    }

    return data?.company_id === currentUserCompanyId;
  } catch (error) {
    console.error("Error in isUserInSameCompany:", error);
    return false;
  }
};

/**
 * التحقق من أن الموقع ينتمي لنفس الشركة
 * @param locationId - معرف الموقع
 * @param currentUserCompanyId - معرف شركة المستخدم الحالي
 * @returns true إذا كان الموقع ينتمي لنفس الشركة
 */
export const isLocationInSameCompany = async (
  locationId: string,
  currentUserCompanyId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("company_id")
      .eq("id", locationId)
      .single();

    if (error) {
      console.error("Error checking location company:", error);
      return false;
    }

    return data?.company_id === currentUserCompanyId;
  } catch (error) {
    console.error("Error in isLocationInSameCompany:", error);
    return false;
  }
};

/**
 * التحقق من أن الفرع ينتمي لنفس الشركة
 * @param branchId - معرف الفرع
 * @param currentUserCompanyId - معرف شركة المستخدم الحالي
 * @returns true إذا كان الفرع ينتمي لنفس الشركة
 */
export const isBranchInSameCompany = async (
  branchId: string,
  currentUserCompanyId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select("company_id")
      .eq("id", branchId)
      .single();

    if (error) {
      console.error("Error checking branch company:", error);
      return false;
    }

    return data?.company_id === currentUserCompanyId;
  } catch (error) {
    console.error("Error in isBranchInSameCompany:", error);
    return false;
  }
};
