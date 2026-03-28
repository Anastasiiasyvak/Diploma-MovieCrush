import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  updateUsername,
  changePassword,
  updateSoulmateConsent,
  updateLanguage,
  softDeleteUser,
} from './settings.service';
import { updateUserProfile } from '../profile/profile.service';
import { getUserById } from '../shared/user.queries';
import { validatePassword } from '../auth/auth.controller';

const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

export const patchUsername = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body;
    if (!username?.trim()) { res.status(400).json({ error: 'Username is required', field: 'username' }); return; }
    if (username.length < 3)  { res.status(400).json({ error: 'At least 3 characters', field: 'username' }); return; }
    if (username.length > 30) { res.status(400).json({ error: 'Max 30 characters', field: 'username' }); return; }
    if (!USERNAME_REGEX.test(username)) { res.status(400).json({ error: 'Only letters, numbers, . and _', field: 'username' }); return; }
    if (username.startsWith('.') || username.startsWith('_')) { res.status(400).json({ error: 'Cannot start with . or _', field: 'username' }); return; }

    const user = await updateUsername(req.userId!, username.trim());
    res.status(200).json({ user });
  } catch (err: any) {
    if (err.message === 'Username already taken') {
      res.status(409).json({ error: 'This username is already taken', field: 'username' }); return;
    }
    console.error('Patch username error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchName = async (req: AuthRequest, res: Response) => {
  try {
    const { first_name, last_name } = req.body;
    const user = await updateUserProfile(req.userId!, {
      first_name: first_name === null ? null : first_name?.trim() || undefined,
      last_name:  last_name  === null ? null : last_name?.trim()  || undefined,
    });
    const result = user ?? await getUserById(req.userId!);
    res.status(200).json({ user: result });
  } catch (err) {
    console.error('Patch name error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password) { res.status(400).json({ error: 'Current password is required', field: 'current_password' }); return; }

    const passwordError = validatePassword(new_password);
    if (passwordError) { res.status(400).json({ error: passwordError, field: 'new_password' }); return; }

    await changePassword(req.userId!, current_password, new_password);
    res.status(200).json({ message: 'Password updated' });
  } catch (err: any) {
    if (err.message === 'Current password is incorrect') {
      res.status(401).json({ error: 'Current password is incorrect', field: 'current_password' }); return;
    }
    console.error('Patch password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchSocials = async (req: AuthRequest, res: Response) => {
  try {
    const { instagram_username, telegram_username } = req.body;
    const user = await updateUserProfile(req.userId!, {
      instagram_username: instagram_username?.replace(/^@/, '').trim() || null,
      telegram_username:  telegram_username?.replace(/^@/, '').trim()  || null,
    });
    if (!user) { res.status(400).json({ error: 'Nothing to update' }); return; }
    res.status(200).json({ user });
  } catch (err) {
    console.error('Patch socials error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchSoulmate = async (req: AuthRequest, res: Response) => {
  try {
    const { soulmate_consent } = req.body;
    if (typeof soulmate_consent !== 'boolean') { res.status(400).json({ error: 'soulmate_consent must be boolean' }); return; }
    await updateSoulmateConsent(req.userId!, soulmate_consent);
    res.status(200).json({ soulmate_consent });
  } catch (err) {
    console.error('Patch soulmate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchLanguage = async (req: AuthRequest, res: Response) => {
  try {
    const { language } = req.body;
    if (!['en', 'uk'].includes(language)) { res.status(400).json({ error: 'Invalid language' }); return; }
    await updateLanguage(req.userId!, language);
    res.status(200).json({ language });
  } catch (err) {
    console.error('Patch language error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await softDeleteUser(req.userId!);
    res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};