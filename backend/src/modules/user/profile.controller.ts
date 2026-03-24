import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getUserProfile, updateUserProfile, createCustomList, deleteCustomList, toggleListPrivacy } from './user.service';
import { UpdateProfileInput } from './user.types';

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await getUserProfile(req.userId!);
    if (!profile) { res.status(404).json({ error: 'User not found' }); return; }
    res.status(200).json(profile);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const input: UpdateProfileInput = req.body;
    if (input.instagram_username)
      input.instagram_username = input.instagram_username.replace(/^@/, '').trim() || undefined;
    if (input.telegram_username)
      input.telegram_username = input.telegram_username.replace(/^@/, '').trim() || undefined;
    const user = await updateUserProfile(req.userId!, input);
    if (!user) { res.status(400).json({ error: 'Nothing to update' }); return; }
    res.status(200).json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createList = async (req: AuthRequest, res: Response) => {
  try {
    const { name, is_private } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: 'List name is required' }); return; }
    if (name.trim().length > 30) { res.status(400).json({ error: 'List name must be under 30 characters' }); return; }
    const list = await createCustomList(req.userId!, name, is_private ?? false);
    res.status(201).json({ list });
  } catch (err) {
    console.error('Create list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteList = async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params['id'] as string, 10);
    if (isNaN(listId)) { res.status(400).json({ error: 'Invalid list ID' }); return; }
    const deleted = await deleteCustomList(req.userId!, listId);
    if (!deleted) { res.status(404).json({ error: 'List not found or not yours' }); return; }
    res.status(200).json({ message: 'List deleted' });
  } catch (err) {
    console.error('Delete list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const patchList = async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params['id'] as string, 10);
    if (isNaN(listId)) { res.status(400).json({ error: 'Invalid list ID' }); return; }
    const { is_private } = req.body;
    if (typeof is_private !== 'boolean') { res.status(400).json({ error: 'is_private must be boolean' }); return; }
    const list = await toggleListPrivacy(req.userId!, listId, is_private);
    if (!list) { res.status(404).json({ error: 'List not found or not yours' }); return; }
    res.status(200).json({ list });
  } catch (err) {
    console.error('Patch list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};