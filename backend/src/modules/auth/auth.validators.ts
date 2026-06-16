const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (password.length > 72) return 'Password must be less than 72 characters';
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email?.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address';
  if (email.length > 255) return 'Email is too long';
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username?.trim()) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be less than 30 characters';
  if (!USERNAME_REGEX.test(username)) return 'Username can only contain letters, numbers, dots and underscores';
  if (username.startsWith('.') || username.startsWith('_')) return 'Username cannot start with a dot or underscore';
  return null;
};