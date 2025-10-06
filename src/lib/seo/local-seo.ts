/**
 * Local SEO Optimization for CompuCar
 * 
 * Utilities and configurations for local search optimization
 * targeting automotive businesses and local customers.
 */

// Local business information
export const LOCAL_BUSINESS_INFO = {
  name: "CompuCar",
  type: "AutomotiveBusinessplace",
  description: "Premium automotive parts and accessories store specializing in car tuning, performance upgrades, and quality car care products.",
  
  // Business details
  address: {
    streetAddress: "123 Auto Parts Street",
    addressLocality: "Your City",
    addressRegion: "Your State",
    postalCode: "12345",
    addressCountry: "US"
  },
  
  contact: {
    telephone: "+1-555-123-4567",
    email: "info@compucar.com",
    website: "https://compucar.com"
  },
  
  // Business hours
  openingHours: [
    "Mo-Fr 09:00-18:00",
    "Sa 09:00-17:00",
    "Su 10:00-16:00"
  ],
  
  // Service areas
  serviceAreas: [
    "Your City",
    "Nearby City 1",
    "Nearby City 2",
    "Your County"
  ],
  
  // Social media profiles
  socialProfiles: [
    "https://facebook.com/compucar",
    "https://instagram.com/compucar",
    "https://twitter.com/compucar",
    "https://youtube.com/compucar"
  ]
};

// Local SEO keywords and phrases
export const LOCAL_SEO_KEYWORDS = {
  // Primary local keywords
  PRIMARY: [
    "car parts store near me",
    "automotive shop [city]",
    "car accessories [city]",
    "auto parts dealer [city]",
    "car tuning shop [city]"
  ],
  
  // Service-specific local keywords
  SERVICES: [
    "car parts installation [city]",
    "automotive repair [city]",
    "car modification [city]",
    "performance tuning [city]",
    "car accessories fitting [city]"
  ],
  
  // Product + location keywords
  PRODUCTS: [
    "LED headlights [city]",
    "car spoilers [city]",
    "performance exhaust [city]",
    "racing seats [city]",
    "car wheels [city]"
  ],
  
  // Intent-based local keywords
  INTENT: [
    "where to buy car parts [city]",
    "best auto shop [city]",
    "car parts store hours [city]",
    "automotive store reviews [city]",
    "car accessories near [zip code]"
  ]
};

// Google My Business optimization
export const GMB_OPTIMIZATION = {
  // Business categories (primary and secondary)
  categories: [
    "Auto Parts Store", // Primary
    "Car Accessories Store",
    "Automotive Repair Shop",
    "Car Tuning Service",
    "Auto Racing Parts Supplier"
  ],
  
  // Attributes to claim
  attributes: [
    "Wheelchair accessible",
    "Free Wi-Fi",
    "Parking available",
    "Credit cards accepted",
    "Online appointments",
    "Curbside pickup",
    "In-store shopping",
    "Same-day delivery"
  ],
  
  // Post types for regular GMB updates
  postTypes: [
    "product-showcase",
    "service-highlight",
    "behind-the-scenes",
    "customer-testimonial",
    "special-offers",
    "how-to-guides",
    "new-arrivals",
    "community-events"
  ]
};

// Local schema markup generators
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    "name": LOCAL_BUSINESS_INFO.name,
    "description": LOCAL_BUSINESS_INFO.description,
    "url": LOCAL_BUSINESS_INFO.contact.website,
    "telephone": LOCAL_BUSINESS_INFO.contact.telephone,
    "email": LOCAL_BUSINESS_INFO.contact.email,
    
    "address": {
      "@type": "PostalAddress",
      "streetAddress": LOCAL_BUSINESS_INFO.address.streetAddress,
      "addressLocality": LOCAL_BUSINESS_INFO.address.addressLocality,
      "addressRegion": LOCAL_BUSINESS_INFO.address.addressRegion,
      "postalCode": LOCAL_BUSINESS_INFO.address.postalCode,
      "addressCountry": LOCAL_BUSINESS_INFO.address.addressCountry
    },
    
    "openingHoursSpecification": LOCAL_BUSINESS_INFO.openingHours.map(hours => {
      const [days, time] = hours.split(' ');
      const [open, close] = time.split('-');
      
      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": parseDayOfWeek(days),
        "opens": open,
        "closes": close
      };
    }),
    
    "sameAs": LOCAL_BUSINESS_INFO.socialProfiles,
    
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Auto Parts & Accessories",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Performance Parts",
          "itemListElement": ["Exhaust Systems", "Air Intakes", "Turbo Kits"]
        },
        {
          "@type": "OfferCatalog", 
          "name": "Exterior Accessories",
          "itemListElement": ["Spoilers", "Body Kits", "LED Lights"]
        },
        {
          "@type": "OfferCatalog",
          "name": "Interior Accessories", 
          "itemListElement": ["Racing Seats", "Steering Wheels", "Gauges"]
        }
      ]
    },
    
    "areaServed": LOCAL_BUSINESS_INFO.serviceAreas.map(area => ({
      "@type": "City",
      "name": area
    }))
  };
}

export function generateServiceSchema(serviceName: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "AutomotiveBusiness",
      "name": LOCAL_BUSINESS_INFO.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": LOCAL_BUSINESS_INFO.address.addressLocality,
        "addressRegion": LOCAL_BUSINESS_INFO.address.addressRegion
      }
    },
    "serviceType": "Automotive Service",
    "areaServed": LOCAL_BUSINESS_INFO.serviceAreas
  };
}

function parseDayOfWeek(days: string): string[] {
  const dayMap: Record<string, string> = {
    'Mo': 'Monday',
    'Tu': 'Tuesday', 
    'We': 'Wednesday',
    'Th': 'Thursday',
    'Fr': 'Friday',
    'Sa': 'Saturday',
    'Su': 'Sunday'
  };
  
  if (days.includes('-')) {
    // Range like "Mo-Fr"
    const [start, end] = days.split('-');
    const startIndex = Object.keys(dayMap).indexOf(start);
    const endIndex = Object.keys(dayMap).indexOf(end);
    
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const dayKey = Object.keys(dayMap)[i];
      result.push(dayMap[dayKey]);
    }
    return result;
  }
  
  // Single day
  return [dayMap[days]];
}

// Local content strategy
export const LOCAL_CONTENT_STRATEGY = {
  // Location-specific landing pages
  locationPages: [
    {
      title: "Auto Parts Store in [City] - CompuCar",
      description: "Visit CompuCar's [City] location for premium car parts and accessories. Expert installation, competitive prices, and local service.",
      content: {
        sections: [
          "local-intro",
          "featured-products", 
          "local-services",
          "directions-hours",
          "local-testimonials",
          "nearby-landmarks"
        ]
      }
    }
  ],
  
  // Local blog content ideas
  blogContent: [
    "Best Car Washes in [City] - Complete Guide",
    "Top 5 Scenic Driving Routes Near [City]",
    "[City] Car Shows and Events - 2024 Calendar",
    "Winter Driving Tips for [City] Residents",
    "Best Parking Spots for Car Enthusiasts in [City]",
    "Local Car Clubs and Communities in [City]",
    "[City] Automotive Laws and Regulations Guide"
  ],
  
  // Local link building opportunities
  linkBuilding: [
    "Local car clubs and enthusiast groups",
    "Regional automotive forums",
    "Local business directories",
    "Chamber of Commerce",
    "Local event sponsorships", 
    "Car show partnerships",
    "Local news outlets",
    "Regional automotive blogs"
  ]
};

// Local review management
export const REVIEW_MANAGEMENT = {
  // Platforms to monitor
  platforms: [
    "Google My Business",
    "Yelp", 
    "Facebook",
    "Better Business Bureau",
    "AutoZone",
    "CarGurus",
    "Trustpilot"
  ],
  
  // Review response templates
  responseTemplates: {
    positive: {
      template: "Thank you for the {rating}-star review, {name}! We're thrilled you're happy with your {product/service}. We look forward to serving you again at CompuCar!",
      variations: [
        "We appreciate your feedback!",
        "Your support means everything to us!",
        "Thanks for choosing CompuCar!"
      ]
    },
    
    negative: {
      template: "Hi {name}, thank you for bringing this to our attention. We apologize for not meeting your expectations. Please contact us at {phone} so we can make this right. - CompuCar Team",
      escalationContact: "manager@compucar.com"
    },
    
    neutral: {
      template: "Thank you for your review, {name}. We appreciate all feedback as it helps us improve. If you have any specific suggestions, please reach out to us directly."
    }
  },
  
  // Review acquisition strategies
  acquisitionStrategies: [
    "Post-purchase email follow-up",
    "In-store review request cards",
    "Social media review campaigns",
    "Incentivized review programs",
    "Staff training on review requests",
    "QR codes linking to review platforms"
  ]
};

// Local citation building
export const CITATION_SOURCES = {
  // Primary citation sources
  primary: [
    "Google My Business",
    "Bing Places for Business", 
    "Apple Maps",
    "Yelp",
    "Facebook Business"
  ],
  
  // Industry-specific citations
  automotive: [
    "AutoZone Store Locator",
    "CarGurus Dealer Network",
    "Cars.com Dealer Directory",
    "AutoTrader Dealer Listings",
    "Edmunds Dealer Network"
  ],
  
  // Local directories
  local: [
    "Better Business Bureau",
    "Chamber of Commerce",
    "Local newspaper business directories",
    "City/county business listings",
    "Regional automotive associations"
  ],
  
  // Data aggregators
  aggregators: [
    "Acxiom",
    "Factual", 
    "Foursquare",
    "Localeze",
    "Neustar"
  ]
};

// Local SEO audit checklist
export const LOCAL_SEO_AUDIT = {
  // Google My Business optimization
  gmb: [
    "Business information is complete and accurate",
    "Primary category is correctly selected",
    "Business description includes relevant keywords",
    "Hours are accurate and up-to-date",
    "Photos are high-quality and recent",
    "Regular posts are published",
    "Reviews are being responded to",
    "Questions are answered promptly"
  ],
  
  // Website optimization
  website: [
    "NAP (Name, Address, Phone) is consistent across all pages",
    "Local schema markup is implemented",
    "Contact page includes full address and map",
    "Service area pages are created",
    "Local keywords are naturally integrated",
    "Loading speed is optimized for mobile",
    "Local testimonials are featured"
  ],
  
  // Citation consistency
  citations: [
    "Business name is consistent across all platforms",
    "Address format is standardized",
    "Phone number is consistent",
    "Website URL is accurate",
    "Business categories are relevant",
    "Duplicate listings are identified and merged"
  ]
};

// Local keyword research utilities
export function generateLocalKeywords(baseKeyword: string, locations: string[]): string[] {
  const modifiers = [
    "near me",
    "in {location}",
    "{location}",
    "near {location}",
    "{location} area",
    "best in {location}",
    "top {location}",
    "{location} services"
  ];
  
  const keywords: string[] = [];
  
  locations.forEach(location => {
    modifiers.forEach(modifier => {
      if (modifier.includes("{location}")) {
        keywords.push(baseKeyword + " " + modifier.replace("{location}", location));
      } else {
        keywords.push(baseKeyword + " " + modifier);
      }
    });
  });
  
  return keywords;
}
