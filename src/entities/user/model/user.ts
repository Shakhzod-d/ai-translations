/** Extension point for authentication. Until accounts exist, everyone is a local guest. */
export interface User {
  id: string;
  displayName: string;
  isGuest: boolean;
}

export const GUEST_USER: User = { id: 'guest', displayName: 'Guest', isGuest: true };

export const useCurrentUser = (): User => GUEST_USER;
