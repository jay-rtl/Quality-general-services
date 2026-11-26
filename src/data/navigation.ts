import { services, serviceHref } from './services';

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; index?: string }[];
}

export const primaryNav: NavItem[] = [
  { label: 'About', href: '/about' },
  {
    label: 'Services',
    href: '/services',
    children: services.map((s) => ({ label: s.navTitle, href: serviceHref(s), index: s.index })),
  },
  { label: 'Projects', href: '/projects' },
  // Client requirement: Careers must be clearly visible in the main navigation.
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

export const ctas = {
  quote: { label: 'Request a Quote', href: '/contact#quote' },
  services: { label: 'Explore Our Services', href: '/services' },
  apply: { label: 'Apply Now', href: '/careers#apply' },
  contact: { label: 'Contact Us', href: '/contact' },
} as const;
