import { apiFetch } from '../api/client';

/**
 * Promote or demote a user's admin role.
 * @param {string} userId - The target user's _id
 * @param {boolean} isAdmin - true to promote, false to demote
 */
export const setAdminRole = (userId, isAdmin) =>
  apiFetch(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ isAdmin }),
  });

/**
 * Permanently delete a user and all their quiz attempts.
 * @param {string} userId - The target user's _id
 */
export const deleteUser = (userId) =>
  apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
