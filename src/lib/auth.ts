// Local Session Management for Hader HR System
// This is a temporary solution for testing purposes
// In production, use proper Supabase Auth with encrypted passwords

export interface SessionData {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: "super_admin" | "hr_admin" | "loc_manager" | "employee";
  companyId?: string;
  branchId?: string;
  expiresAt: number;
  createdAt: number;
}

const SESSION_KEY = "hader_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Save user session to localStorage
 */
export const saveSession = (userData: {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: "super_admin" | "hr_admin" | "loc_manager" | "employee";
  companyId?: string;
  branchId?: string;
}): void => {
  const now = Date.now();
  const sessionData: SessionData = {
    ...userData,
    expiresAt: now + SESSION_DURATION,
    createdAt: now,
  };

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error("Failed to save session:", error);
  }
};

/**
 * Get current session from localStorage
 */
export const getSession = (): SessionData | null => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) {
      return null;
    }

    const session: SessionData = JSON.parse(sessionStr);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    clearSession();
    return null;
  }
};

/**
 * Clear current session from localStorage
 */
export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
};

/**
 * Check if there is a valid session
 */
export const isSessionValid = (): boolean => {
  const session = getSession();
  return session !== null;
};

/**
 * Check if user has required role
 */
export const hasRole = (
  requiredRole: "super_admin" | "hr_admin" | "loc_manager" | "employee"
): boolean => {
  const session = getSession();
  if (!session) {
    return false;
  }

  // Super admin can access everything
  if (session.role === "super_admin") {
    return true;
  }

  return session.role === requiredRole;
};

/**
 * Get session time remaining in milliseconds
 */
export const getSessionTimeRemaining = (): number => {
  const session = getSession();
  if (!session) {
    return 0;
  }

  const remaining = session.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Extend session expiration time
 */
export const extendSession = (): boolean => {
  const session = getSession();
  if (!session) {
    return false;
  }

  try {
    const updatedSession: SessionData = {
      ...session,
      expiresAt: Date.now() + SESSION_DURATION,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    return true;
  } catch (error) {
    console.error("Failed to extend session:", error);
    return false;
  }
};
