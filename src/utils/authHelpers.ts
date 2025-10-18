/**
 * Authentication Helper Functions
 *
 * هذه الدوال تساعد في إدارة نظام المصادقة مع دعم:
 * - Username كمعرف أساسي
 * - Email اختياري (مع email داخلي مُولد)
 * - Phone اختياري (للاستخدام مع WhatsApp لاحقاً)
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * النطاق الداخلي المستخدم للـ Email المُولد
 */
const INTERNAL_EMAIL_DOMAIN = '@internal.hader.local';

/**
 * توليد email داخلي من username
 *
 * @param username - اسم المستخدم
 * @returns email داخلي بصيغة: {username}@internal.hader.local
 *
 * @example
 * generateInternalEmail('ahmed_ali') // 'ahmed_ali@internal.hader.local'
 */
export function generateInternalEmail(username: string): string {
  // تنظيف username من أي مسافات أو رموز خاصة
  const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_');
  return `${cleanUsername}${INTERNAL_EMAIL_DOMAIN}`;
}

/**
 * التحقق من أن Email داخلي (مُولد) وليس حقيقي
 *
 * @param email - البريد الإلكتروني للتحقق منه
 * @returns true إذا كان Email داخلي، false إذا كان حقيقي
 *
 * @example
 * isInternalEmail('ahmed_ali@internal.hader.local') // true
 * isInternalEmail('ahmed@gmail.com') // false
 */
export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.endsWith(INTERNAL_EMAIL_DOMAIN);
}

/**
 * الحصول على username من email داخلي
 *
 * @param email - البريد الإلكتروني الداخلي
 * @returns username أو null إذا لم يكن email داخلي
 *
 * @example
 * getUsernameFromInternalEmail('ahmed_ali@internal.hader.local') // 'ahmed_ali'
 * getUsernameFromInternalEmail('ahmed@gmail.com') // null
 */
export function getUsernameFromInternalEmail(email: string): string | null {
  if (!isInternalEmail(email)) return null;
  return email.replace(INTERNAL_EMAIL_DOMAIN, '');
}

/**
 * التحقق من صحة البريد الإلكتروني
 *
 * @param email - البريد الإلكتروني للتحقق منه
 * @returns true إذا كان email صحيح
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الجوال السعودي
 *
 * @param phone - رقم الجوال للتحقق منه
 * @returns true إذا كان رقم جوال سعودي صحيح
 *
 * @example
 * isValidSaudiPhone('+966501234567') // true
 * isValidSaudiPhone('0501234567') // true
 * isValidSaudiPhone('501234567') // true
 */
export function isValidSaudiPhone(phone: string): boolean {
  // إزالة المسافات والشرطات
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // أنماط مقبولة:
  // +966501234567
  // 966501234567
  // 0501234567
  // 501234567
  const patterns = [
    /^\+966[5][0-9]{8}$/,  // +966 5XX XXX XXX
    /^966[5][0-9]{8}$/,    // 966 5XX XXX XXX
    /^0[5][0-9]{8}$/,      // 05X XXX XXXX
    /^[5][0-9]{8}$/,       // 5X XXX XXXX
  ];

  return patterns.some(pattern => pattern.test(cleanPhone));
}

/**
 * تنسيق رقم الجوال السعودي إلى صيغة دولية
 *
 * @param phone - رقم الجوال
 * @returns رقم بصيغة +966XXXXXXXXX
 *
 * @example
 * formatSaudiPhone('0501234567') // '+966501234567'
 * formatSaudiPhone('501234567') // '+966501234567'
 */
export function formatSaudiPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s-]/g, '');

  // إذا كان يبدأ بـ +966
  if (cleanPhone.startsWith('+966')) {
    return cleanPhone;
  }

  // إذا كان يبدأ بـ 966
  if (cleanPhone.startsWith('966')) {
    return `+${cleanPhone}`;
  }

  // إذا كان يبدأ بـ 0
  if (cleanPhone.startsWith('0')) {
    return `+966${cleanPhone.substring(1)}`;
  }

  // إذا كان يبدأ بـ 5
  return `+966${cleanPhone}`;
}

/**
 * إنشاء حساب مستخدم جديد
 *
 * @param userData - بيانات المستخدم
 * @returns معرف المستخدم أو خطأ
 */
export interface CreateUserData {
  username: string;
  password: string;
  fullName: string;
  companyId: string;
  branchId: string;
  role: 'employee' | 'loc_manager' | 'hr_admin' | 'super_admin';
  email?: string;  // اختياري
  phone?: string;  // اختياري
  employeeData?: {
    employeeNumber: string;
    locationId: string;
    shiftId?: string;
    department?: string;
    position?: string;
    hireDate?: string;
  };
}

export async function createUserAccount(userData: CreateUserData) {
  try {
    // 1. التحقق من أن username غير مستخدم
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', userData.username)
      .maybeSingle();

    if (existingUser) {
      return { error: 'اسم المستخدم مستخدم بالفعل' };
    }

    // 2. تحديد Email (داخلي أو حقيقي)
    const authEmail = userData.email && isValidEmail(userData.email)
      ? userData.email
      : generateInternalEmail(userData.username);

    const isRealEmail = userData.email && isValidEmail(userData.email);

    // 3. إنشاء حساب في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: userData.password,
      email_confirm: true, // تأكيد تلقائي للـ email الداخلي
    });

    if (authError) {
      return { error: authError.message };
    }

    // 4. تنسيق رقم الجوال إذا كان موجود
    const formattedPhone = userData.phone && isValidSaudiPhone(userData.phone)
      ? formatSaudiPhone(userData.phone)
      : userData.phone;

    // 5. إضافة بيانات المستخدم في جدول users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        username: userData.username,
        email: isRealEmail ? userData.email : null, // null إذا كان email داخلي
        phone: formattedPhone || null,
        phone_verified: false,
        full_name: userData.fullName,
        company_id: userData.companyId,
        branch_id: userData.branchId,
        role: userData.role,
      });

    if (userError) {
      // حذف المستخدم من Auth إذا فشل إنشاء البروفايل
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: userError.message };
    }

    // 6. إذا كان موظف، إضافة بيانات الموظف
    if (userData.role === 'employee' && userData.employeeData) {
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: authData.user.id,
          employee_number: userData.employeeData.employeeNumber,
          location_id: userData.employeeData.locationId,
          shift_id: userData.employeeData.shiftId,
          department: userData.employeeData.department,
          position: userData.employeeData.position,
          hire_date: userData.employeeData.hireDate,
          vacation_balance: 21,
          sick_leave_balance: 10,
        });

      if (employeeError) {
        // حذف المستخدم إذا فشل إنشاء بيانات الموظف
        await supabase.auth.admin.deleteUser(authData.user.id);
        await supabase.from('users').delete().eq('id', authData.user.id);
        return { error: employeeError.message };
      }
    }

    return {
      data: {
        userId: authData.user.id,
        username: userData.username,
        email: authEmail,
        isInternalEmail: !isRealEmail
      }
    };

  } catch (error) {
    console.error('Error creating user account:', error);
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return { error: message };
  }
}

/**
 * تحديث email المستخدم من داخلي إلى حقيقي
 *
 * @param newEmail - البريد الإلكتروني الجديد
 * @returns نجاح أو خطأ
 */
export async function updateUserEmail(newEmail: string) {
  try {
    // 1. التحقق من صحة Email
    if (!isValidEmail(newEmail)) {
      return { error: 'البريد الإلكتروني غير صحيح' };
    }

    // 2. التحقق من أن المستخدم مسجل دخول
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'يجب تسجيل الدخول أولاً' };
    }

    // 3. التحقق من أن Email الحالي داخلي
    if (!isInternalEmail(user.email)) {
      return { error: 'البريد الإلكتروني محدث بالفعل' };
    }

    // 4. تحديث Email في Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (authError) {
      return { error: authError.message };
    }

    // 5. تحديث Email في جدول users
    const { error: dbError } = await supabase
      .from('users')
      .update({
        email: newEmail,
      })
      .eq('id', user.id);

    if (dbError) {
      return { error: dbError.message };
    }

    return {
      data: {
        message: 'تم إرسال رابط التأكيد إلى البريد الإلكتروني الجديد',
        newEmail
      }
    };

  } catch (error) {
    console.error('Error updating email:', error);
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return { error: message };
  }
}

/**
 * تحديث رقم جوال المستخدم
 *
 * @param newPhone - رقم الجوال الجديد
 * @returns نجاح أو خطأ
 */
export async function updateUserPhone(newPhone: string) {
  try {
    // 1. التحقق من صحة رقم الجوال
    if (!isValidSaudiPhone(newPhone)) {
      return { error: 'رقم الجوال غير صحيح' };
    }

    // 2. التحقق من أن المستخدم مسجل دخول
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'يجب تسجيل الدخول أولاً' };
    }

    // 3. تنسيق رقم الجوال
    const formattedPhone = formatSaudiPhone(newPhone);

    // 4. تحديث رقم الجوال في جدول users
    const { error: dbError } = await supabase
      .from('users')
      .update({
        phone: formattedPhone,
        phone_verified: false, // سيتم التحقق منه لاحقاً عبر WhatsApp
      })
      .eq('id', user.id);

    if (dbError) {
      return { error: dbError.message };
    }

    return {
      data: {
        message: 'تم تحديث رقم الجوال بنجاح',
        phone: formattedPhone
      }
    };

  } catch (error) {
    console.error('Error updating phone:', error);
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return { error: message };
  }
}
