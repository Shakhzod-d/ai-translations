import { BookOpen, FolderOpen, Home, Settings, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/shared/config';

export interface NavItem {
  to: string;
  labelKey: 'nav.home' | 'nav.documents' | 'nav.vocabulary' | 'nav.settings';
  icon: LucideIcon;
  end?: boolean;
}

/** Add future routes (statistics, flashcards…) here; both navigations pick them up. */
export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, labelKey: 'nav.home', icon: Home, end: true },
  { to: ROUTES.documents, labelKey: 'nav.documents', icon: FolderOpen },
  { to: ROUTES.vocabulary, labelKey: 'nav.vocabulary', icon: BookOpen },
  { to: ROUTES.settings, labelKey: 'nav.settings', icon: Settings },
];
