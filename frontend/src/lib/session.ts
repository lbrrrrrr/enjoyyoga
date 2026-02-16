export interface SessionData {
  userId: string;
  username: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export function clearSessionCookies() {
  document.cookie = 'admin_session=; Path=/; Max-Age=0';
  document.cookie = 'admin_user=; Path=/; Max-Age=0';

  // Dispatch custom event to notify components of session change
  window.dispatchEvent(new CustomEvent('adminSessionChanged'));
}

export function notifySessionChange() {
  // Helper function to notify components that session may have changed
  window.dispatchEvent(new CustomEvent('adminSessionChanged'));
}

export function getAdminUserFromCookie(): any | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const adminUserCookie = cookies.find(cookie =>
    cookie.trim().startsWith('admin_user=')
  );

  if (!adminUserCookie) {
    return null;
  }

  try {
    // Extract the value part after 'admin_user='
    let cookieValue = adminUserCookie.substring(adminUserCookie.indexOf('=') + 1).trim();

    // Remove surrounding quotes if present
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }

    // Decode Base64 first, then parse JSON
    const decodedJson = atob(cookieValue);
    const parsedValue = JSON.parse(decodedJson);

    return parsedValue;
  } catch (error) {
    // Silent fail - just return null if parsing fails
    return null;
  }
}

export function isSessionValid(): boolean {
  if (typeof window === 'undefined') return false;

  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(cookie =>
    cookie.trim().startsWith('admin_session=')
  );

  return !!sessionCookie;
}

// Debug function to manually check cookies (call in browser console)
export function debugCookies() {
  const adminUser = getAdminUserFromCookie();
  const sessionValid = isSessionValid();

  return {
    allCookies: document.cookie,
    adminUser,
    sessionValid
  };
}

// Test function to directly test cookie parsing with a known Base64 value
export function testBase64Parsing() {
  // Test with a known good Base64 value
  const testJson = '{"id":"test-123","username":"testuser","email":"test@test.com","role":"admin"}';
  const testBase64 = btoa(testJson);

  console.log('Test JSON:', testJson);
  console.log('Test Base64:', testBase64);

  try {
    const decoded = atob(testBase64);
    const parsed = JSON.parse(decoded);
    console.log('Test decode successful:', parsed);
    return { success: true, decoded, parsed };
  } catch (error) {
    console.error('Test decode failed:', error);
    return { success: false, error };
  }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugCookies = debugCookies;
  (window as any).testBase64Parsing = testBase64Parsing;
}