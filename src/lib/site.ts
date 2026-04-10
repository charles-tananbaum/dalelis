/**
 * Dalelis Mechanical — single source of truth for business info.
 * Edit here to update every page.
 */

export const SITE = {
  legalName: "James A. Dalelis Plumbing, Heating & Air Conditioning",
  name: "Dalelis Mechanical",
  shortName: "Dalelis",
  tagline: "Norwood's Plumbing & HVAC Specialists",
  foundedYear: 2009,
  get yearsInBusiness() {
    return new Date().getFullYear() - this.foundedYear;
  },

  // Contact
  phone: "(617) 716-9144",
  phoneRaw: "+16177169144",
  phoneTel: "tel:+16177169144",
  email: "dalelismechanical@gmail.com",
  emailMailto: "mailto:dalelismechanical@gmail.com",

  // Address
  address: {
    street: "934R Washington St.",
    city: "Norwood",
    state: "MA",
    zip: "02062",
    country: "US",
    lat: 42.1945,
    lng: -71.1994,
  },

  // Trust signals
  rating: { score: 4.9, count: 85, outOf: 5 }, // count is approximate, marked TODO
  licenses: {
    masterPlumbing: "16185",
    hvac: "6433",
  },

  // URLs — PRESERVED VERBATIM from source site
  booking: "https://book.housecallpro.com/book/James-A-Dalelis-Plumbing--Hvac-LLC/10a27057d6f746adaa9eac653d1b8a49?v2=true",
  googleReviews: "https://maps.app.goo.gl/ntu5qG1QcnoCNXRk8",
  googleMaps: "https://maps.app.goo.gl/cLwF6AekysPyy1BB7",
  facebook: "https://www.facebook.com/dalelisplumbing/",

  // Site URL
  url: "https://www.dalelismechanical.com",
};

export const BRANDS_HVAC = [
  "Rheem", "Lennox", "Mitsubishi Electric", "Carrier", "Viessmann",
  "Buderus", "Burnham", "York", "Goodman", "Comfort-Aire",
];

export const BRANDS_WATER_HEATER = [
  "Rinnai", "Bradford White", "State Water Heaters",
];

export const BRANDS_FIXTURES = [
  "Moen", "Kohler", "Grohe", "Delta",
];

export const CERTIFICATIONS = [
  { name: "NATE Certified", short: "NATE" },
  { name: "Mass Save Partner", short: "Mass Save" },
  { name: "PHCC Member", short: "PHCC" },
  { name: "Licensed & Insured", short: "Licensed" },
  { name: "Angi Certified", short: "Angi" },
];

export const TRUST_BADGES = [
  { label: `Since ${SITE.foundedYear}`, sub: `${SITE.yearsInBusiness}+ years serving Norwood` },
  { label: "4.9 ★ Google", sub: "Hundreds of 5-star reviews" },
  { label: "24/7 Emergency", sub: "Available when you need us" },
  { label: "Licensed & Insured", sub: `MA #${SITE.licenses.masterPlumbing} · HVAC #${SITE.licenses.hvac}` },
];

// Featured service areas (shown in footer + homepage)
export const FEATURED_AREAS = [
  "Norwood", "Canton", "Dedham", "Medfield", "Sharon", "Walpole", "Westwood",
];

// All service areas
export const ALL_SERVICE_AREAS = [
  "Arlington", "Ashland", "Bedford", "Belmont", "Brookline", "Burlington",
  "Canton", "Concord", "Dedham", "Dover", "Easton", "Foxborough", "Franklin",
  "Framingham", "Holliston", "Hopkinton", "Lexington", "Maynard", "Medfield",
  "Medway", "Melrose", "Milford", "Millis", "Milton", "Natick", "Needham",
  "Newton", "Norfolk", "Norwood", "Sharon", "Sherborn", "Southborough",
  "Stoughton", "Sudbury", "Walpole", "Waltham", "Watertown", "Wayland",
  "Wellesley", "West Roxbury", "Westwood", "Woburn",
];
