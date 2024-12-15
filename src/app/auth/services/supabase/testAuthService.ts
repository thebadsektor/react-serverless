import { login, logout } from './authService';

export const testLoginLogout = async () => {
  try {
    // Test login
    const { user, session } = await login('', '');
    console.log('Login successful:', { user, session });

    // Test logout
    await logout();
    console.log('Logout successful');
  } catch (error) {
    console.error('Auth test failed:', error);
  }
};
