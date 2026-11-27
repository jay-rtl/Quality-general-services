import type { ImageMetadata } from 'astro';

// Authentic client photographs (portrait 3:4 WebP, EXIF stripped)
import imgRestoration from '@/assets/images/client/fire-damage-restoration-cleanup.webp';
import imgContents from '@/assets/images/client/qgs-contents-packout-loading.webp';
import imgCommercial from '@/assets/images/client/commercial-carpet-extraction.webp';
import imgPostConstruction from '@/assets/images/client/washroom-detail-cleaning.webp';
import imgRemediation from '@/assets/images/client/qgs-containment-preparation.webp';
import imgWorkforce from '@/assets/images/client/commercial-rooftop-cleanup-crew.webp';

// Widescreen landscape placeholders retained solely for full-bleed 100vw PageHero backdrops
// so portrait client photos are not distorted into ultra-wide banners.
import heroRestoration from '@/assets/images/placeholder/hero-restoration.jpg';
import heroContents from '@/assets/images/placeholder/service-contents.jpg';
import heroCommercial from '@/assets/images/placeholder/service-commercial.jpg';
import heroPostConstruction from '@/assets/images/placeholder/service-postconstruction.jpg';
import heroRemediation from '@/assets/images/placeholder/hero-remediation.jpg';
import heroWorkforce from '@/assets/images/placeholder/hero-construction.jpg';

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
  /** Authentic client photograph for portrait / vertical editorial containers */
  image: ImageMetadata;
  imageAlt: string;
  /** CSS object-position focal point for clean framing */
  imagePosition?: string;
  /** Widescreen landscape image for full-bleed PageHero backdrops */
  heroImage: ImageMetadata;
  heroImageAlt: string;
}

/**
 * Content source: client questionnaire, "Main services or products to showcase".
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
    imageAlt: 'Crew members in protective coveralls and respirators performing interior fire-damage cleanup and debris bagging',
    imagePosition: '50% 42%',
    heroImage: heroRestoration,
    heroImageAlt: 'Placeholder: water-damaged commercial interior with drying equipment',
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
    imageAlt: 'Quality General Services team members loading wrapped contents from a flatbed cart into a box truck',
    imagePosition: '50% 35%',
    heroImage: heroContents,
    heroImageAlt: 'Placeholder: technician wrapping furniture for a contents pack-out',
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
    imageAlt: 'Technician performing commercial hallway carpet extraction with professional hose equipment',
    imagePosition: '50% 30%',
    heroImage: heroCommercial,
    heroImageAlt: 'Placeholder: cleaner wiping a boardroom table in an open-plan office after hours',
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
    imageAlt: 'Cleaner performing detailed washroom fixture cleaning during renovation and post-construction prep',
    imagePosition: '50% 35%',
    heroImage: heroPostConstruction,
    heroImageAlt: 'Placeholder: worker removing protective film from new windows in a renovated space',
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
    imageAlt: 'Quality General Services technician preparing sealed plastic containment sheeting inside a work area',
    imagePosition: '50% 42%',
    heroImage: heroRemediation,
    heroImageAlt: 'Placeholder: technicians in protective coveralls working inside a remediation containment',
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
    imageAlt: 'Two crew members in protective coveralls clearing debris on a commercial rooftop',
    imagePosition: '50% 48%',
    heroImage: heroWorkforce,
    heroImageAlt: 'Placeholder: workers cleaning window frames in a newly finished commercial interior',
  },
];

export const serviceHref = (s: Service) => `/services/${s.slug}`;
