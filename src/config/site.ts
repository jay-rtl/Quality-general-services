/**
 * Single source of truth for business facts.
 * Every value here comes from the client questionnaire (Website Requirements PDF).
 * Do not add claims (certifications, counts, testimonials) without client confirmation.
 */
export const site = {
  name: 'Quality General Services',
  shortName: 'QGS',
  tagline: 'Built on Experience. Driven by Quality.',
  description:
    'Calgary-based restoration support, commercial cleaning, specialized remediation and workforce solutions for restoration companies, general contractors, property managers and commercial organizations.',
  established: 2023,
  serviceArea: 'Calgary and surrounding areas',
  contact: {
    email: 'qualitygeneralservices2023@gmail.com',
    phoneDisplay: '587 718 3300',
    phoneHref: 'tel:+15877183300',
    address: {
      street: '14560 Mount McKenzie Dr SE',
      city: 'Calgary',
      region: 'AB',
      country: 'CA',
    },
  },
  experience: {
    combinedYears: 'Nearly 20',
    partnerA: 'Over 10 years in the restoration industry',
    partnerB: 'Nearly 10 years of practical, on-site experience',
  },
  mission:
    'To provide reliable, professional, and high-quality commercial cleaning, restoration support, and specialized site services while maintaining safe working environments and building strong, lasting relationships with our clients, employees, and business partners.',
  // Social links / business hours were left blank by the client.
  social: [] as { label: string; href: string }[],
} as const;

export type Site = typeof site;
