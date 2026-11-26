import type { ImageMetadata } from 'astro';

import imgRestoration from '@/assets/images/placeholder/service-restoration.jpg';
import imgContents from '@/assets/images/placeholder/service-contents.jpg';
import imgCommercial from '@/assets/images/placeholder/service-commercial.jpg';
import imgPostConstruction from '@/assets/images/placeholder/service-postconstruction.jpg';
import imgRemediation from '@/assets/images/placeholder/hero-remediation.jpg';
import imgWorkforce from '@/assets/images/placeholder/hero-construction.jpg';

export interface Service {
  slug: string;
  index: string;
  title: string;
  /** Short title for navigation */
  navTitle: string;
  /** One-line summary, taken from the client questionnaire */
  summary: string;
  /** Detailed scope items exactly as supplied by the client (may be empty) */
  scope: string[];
  /** Additional qualifying note required by the client (e.g. licensing) */
  note?: string;
  /** Value for the quote form "service" select */
  formValue: string;
  image: ImageMetadata;
  imageAlt: string;
}

/**
 * Content source: client questionnaire, "Main services or products to showcase".
 * Service 4 was supplied with a one-line description only; service 6 was cut off
 * in the PDF and completed with the client's own audience wording. Confirm both.
 */
export const services: Service[] = [
  {
    slug: 'restoration-support',
    index: '01',
    title: 'Restoration Staffing & Labour Support',
    navTitle: 'Restoration Support',
    summary:
      'Dependable workforce and labour support for restoration companies and contractors handling residential and commercial restoration projects.',
    scope: [
      'Water damage restoration support',
      'Fire and smoke restoration support',
      'Emergency cleanup assistance',
      'Demolition and site cleanup',
      'Restoration labour assistance',
      'Contents handling and moving',
      'Property cleanup and preparation',
      'Construction and reconstruction support',
      'Project-based restoration crews',
      'Temporary and additional workforce support',
    ],
    formValue: 'restoration-support',
    image: imgRestoration,
    imageAlt: 'Placeholder: restoration crew removing water-damaged drywall beside air movers',
  },
  {
    slug: 'contents-processing-cleaning',
    index: '02',
    title: 'Contents Processing & Cleaning',
    navTitle: 'Contents Processing & Cleaning',
    summary:
      'Professional contents handling, cleaning, and processing services for residential and commercial restoration projects.',
    scope: [
      'Contents pack-out and pack-back',
      'Furniture handling and cleaning',
      'Household contents cleaning',
      'Contents inventory and documentation assistance',
      'Handling and transportation coordination',
      'Restoration-related contents processing',
    ],
    formValue: 'contents-processing',
    image: imgContents,
    imageAlt: 'Placeholder: technician wrapping an armchair for a contents pack-out',
  },
  {
    slug: 'commercial-janitorial-cleaning',
    index: '03',
    title: 'Commercial & Janitorial Cleaning',
    navTitle: 'Commercial & Janitorial Cleaning',
    summary: 'Professional cleaning solutions for commercial buildings, businesses, and facilities.',
    scope: [
      'Office cleaning',
      'Commercial janitorial services',
      'Building maintenance cleaning',
      'Dusting and surface cleaning',
      'Deep cleaning',
      'Recurring cleaning contracts',
      'One-time commercial cleaning',
    ],
    formValue: 'commercial-cleaning',
    image: imgCommercial,
    imageAlt: 'Placeholder: cleaner wiping a boardroom table in an open-plan office after hours',
  },
  {
    slug: 'post-construction-cleaning',
    index: '04',
    title: 'Post-Construction Cleaning',
    navTitle: 'Post-Construction Cleaning',
    summary: 'Detailed cleaning services for newly constructed, renovated, and remodeled properties.',
    scope: [],
    formValue: 'post-construction',
    image: imgPostConstruction,
    imageAlt: 'Placeholder: worker removing protective film from new windows in a renovated space',
  },
  {
    slug: 'asbestos-abatement-mould-remediation',
    index: '05',
    title: 'Asbestos Abatement & Mould Remediation',
    navTitle: 'Asbestos & Mould Remediation',
    summary:
      'Asbestos abatement and mould remediation for residential, commercial, and restoration projects across Calgary and surrounding areas. We partner with contractors, property managers, restoration companies, and building owners to execute specialized remediation safely and efficiently.',
    scope: [],
    note: 'Subject to applicable licensing, training, certification, and regulatory requirements.',
    formValue: 'asbestos-mould',
    image: imgRemediation,
    imageAlt: 'Placeholder: technicians in protective coveralls working inside a remediation containment',
  },
  {
    slug: 'workforce-staffing-solutions',
    index: '06',
    title: 'Workforce & Project-Based Staffing Solutions',
    navTitle: 'Workforce & Staffing Solutions',
    summary:
      'Flexible workforce support for businesses and contractors requiring temporary or project-based workers.',
    scope: [],
    formValue: 'workforce-staffing',
    image: imgWorkforce,
    imageAlt: 'Placeholder: two workers cleaning window frames in a newly finished commercial interior',
  },
];

export const serviceHref = (s: Service) => `/services/${s.slug}`;
