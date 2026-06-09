import {
  validatePassword,
  validateEmail,
  validateUsername,
} from './auth.validators';


describe('validatePassword', () => {

  it('accepts a valid password (lowercase + uppercase + digit, 8+ chars)', () => {
    expect(validatePassword('Password1')).toBeNull();
  });

  it('rejects when shorter than 8 characters', () => {
    expect(validatePassword('Pass1')).toBe('Password must be at least 8 characters');
  });

  it('rejects when no uppercase letter', () => {
    expect(validatePassword('password1')).toBe('Password must contain at least one uppercase letter');
  });

  it('rejects when no lowercase letter', () => {
    expect(validatePassword('PASSWORD1')).toBe('Password must contain at least one lowercase letter');
  });

  it('rejects when no digit', () => {
    expect(validatePassword('Password')).toBe('Password must contain at least one number');
  });

  it('rejects when longer than 72 characters (bcrypt limit)', () => {
    const tooLong = 'A' + 'a'.repeat(70) + '12';
    expect(tooLong.length).toBeGreaterThan(72);
    expect(validatePassword(tooLong)).toBe('Password must be less than 72 characters');
  });

  it('accepts password exactly 8 characters with all rules', () => {
    expect(validatePassword('Aa123456')).toBeNull();
  });

  it('accepts password exactly 72 characters', () => {
    const exact72 = 'A' + 'a'.repeat(69) + '12';
    expect(exact72.length).toBe(72);
    expect(validatePassword(exact72)).toBeNull();
  });

  it('rejects empty string with length rule first', () => {
    expect(validatePassword('')).toBe('Password must be at least 8 characters');
  });

  it('accepts password with special characters', () => {
    expect(validatePassword('P@ssw0rd!')).toBeNull();
  });
});


describe('validateEmail', () => {

  it('accepts a standard valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('accepts email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toBeNull();
  });

  it('accepts email with plus addressing', () => {
    expect(validateEmail('user+tag@example.com')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('rejects whitespace-only string', () => {
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('rejects email without @', () => {
    expect(validateEmail('userexample.com')).toBe('Please enter a valid email address');
  });

  it('rejects email without domain', () => {
    expect(validateEmail('user@')).toBe('Please enter a valid email address');
  });

  it('rejects email without TLD', () => {
    expect(validateEmail('user@example')).toBe('Please enter a valid email address');
  });

  it('rejects email with spaces', () => {
    expect(validateEmail('us er@example.com')).toBe('Please enter a valid email address');
  });

  it('rejects email longer than 255 characters', () => {
    const huge = 'a'.repeat(251) + '@a.co';
    expect(huge.length).toBeGreaterThan(255);
    expect(validateEmail(huge)).toBe('Email is too long');
  });
});


describe('validateUsername', () => {

  it('accepts a standard username', () => {
    expect(validateUsername('alice')).toBeNull();
  });

  it('accepts username with digits', () => {
    expect(validateUsername('alice42')).toBeNull();
  });

  it('accepts username with dot in the middle', () => {
    expect(validateUsername('alice.smith')).toBeNull();
  });

  it('accepts username with underscore in the middle', () => {
    expect(validateUsername('alice_smith')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateUsername('')).toBe('Username is required');
  });

  it('rejects whitespace-only string', () => {
    expect(validateUsername('   ')).toBe('Username is required');
  });

  it('rejects username shorter than 3 characters', () => {
    expect(validateUsername('ab')).toBe('Username must be at least 3 characters');
  });

  it('rejects username longer than 30 characters', () => {
    const tooLong = 'a'.repeat(31);
    expect(validateUsername(tooLong)).toBe('Username must be less than 30 characters');
  });

  it('rejects username with special characters', () => {
    expect(validateUsername('alice!')).toBe('Username can only contain letters, numbers, dots and underscores');
  });

  it('rejects username with spaces', () => {
    expect(validateUsername('alice smith')).toBe('Username can only contain letters, numbers, dots and underscores');
  });

  it('rejects username starting with a dot', () => {
    expect(validateUsername('.alice')).toBe('Username cannot start with a dot or underscore');
  });

  it('rejects username starting with an underscore', () => {
    expect(validateUsername('_alice')).toBe('Username cannot start with a dot or underscore');
  });

  it('accepts username at exact minimum length (3)', () => {
    expect(validateUsername('abc')).toBeNull();
  });

  it('accepts username at exact maximum length (30)', () => {
    expect(validateUsername('a'.repeat(30))).toBeNull();
  });
});