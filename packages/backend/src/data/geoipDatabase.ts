// Types are used in the interface definitions below

/**
 * Local GeoIP database with major IP ranges and their locations
 * This is a simplified database for demonstration - in production you'd use
 * a comprehensive database like MaxMind GeoLite2 or similar
 */

export interface GeoIPRange {
  startIP: string;
  endIP: string;
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
  asn?: number;
  asnOrganization?: string;
  connectionType?: 'residential' | 'business' | 'mobile' | 'hosting' | 'unknown';
}

// Major public DNS servers and well-known IP ranges
export const GEOIP_RANGES: GeoIPRange[] = [
  // Google DNS
  {
    startIP: '8.8.8.8',
    endIP: '8.8.8.8',
    country: 'United States',
    countryCode: 'US',
    region: 'California',
    city: 'Mountain View',
    latitude: 37.4056,
    longitude: -122.0775,
    timezone: 'America/Los_Angeles',
    isp: 'Google LLC',
    organization: 'Google Public DNS',
    asn: 15169,
    asnOrganization: 'Google LLC',
    connectionType: 'hosting'
  },
  {
    startIP: '8.8.4.4',
    endIP: '8.8.4.4',
    country: 'United States',
    countryCode: 'US',
    region: 'California',
    city: 'Mountain View',
    latitude: 37.4056,
    longitude: -122.0775,
    timezone: 'America/Los_Angeles',
    isp: 'Google LLC',
    organization: 'Google Public DNS',
    asn: 15169,
    asnOrganization: 'Google LLC',
    connectionType: 'hosting'
  },

  // Cloudflare DNS
  {
    startIP: '1.1.1.1',
    endIP: '1.1.1.1',
    country: 'United States',
    countryCode: 'US',
    region: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    isp: 'Cloudflare Inc',
    organization: 'Cloudflare Public DNS',
    asn: 13335,
    asnOrganization: 'Cloudflare Inc',
    connectionType: 'hosting'
  },
  {
    startIP: '1.0.0.1',
    endIP: '1.0.0.1',
    country: 'United States',
    countryCode: 'US',
    region: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    isp: 'Cloudflare Inc',
    organization: 'Cloudflare Public DNS',
    asn: 13335,
    asnOrganization: 'Cloudflare Inc',
    connectionType: 'hosting'
  },

  // OpenDNS
  {
    startIP: '208.67.222.222',
    endIP: '208.67.222.222',
    country: 'United States',
    countryCode: 'US',
    region: 'California',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
    isp: 'Cisco OpenDNS LLC',
    organization: 'OpenDNS',
    asn: 36692,
    asnOrganization: 'Cisco OpenDNS LLC',
    connectionType: 'hosting'
  },

  // Amazon AWS ranges (simplified)
  {
    startIP: '52.0.0.0',
    endIP: '52.255.255.255',
    country: 'United States',
    countryCode: 'US',
    region: 'Virginia',
    city: 'Ashburn',
    latitude: 39.0469,
    longitude: -77.4903,
    timezone: 'America/New_York',
    isp: 'Amazon.com Inc',
    organization: 'Amazon Web Services',
    asn: 16509,
    asnOrganization: 'Amazon.com Inc',
    connectionType: 'hosting'
  },

  // Microsoft Azure ranges (simplified)
  {
    startIP: '40.0.0.0',
    endIP: '40.255.255.255',
    country: 'United States',
    countryCode: 'US',
    region: 'Washington',
    city: 'Redmond',
    latitude: 47.674,
    longitude: -122.1215,
    timezone: 'America/Los_Angeles',
    isp: 'Microsoft Corporation',
    organization: 'Microsoft Azure',
    asn: 8075,
    asnOrganization: 'Microsoft Corporation',
    connectionType: 'hosting'
  },

  // European ranges
  {
    startIP: '185.0.0.0',
    endIP: '185.255.255.255',
    country: 'Germany',
    countryCode: 'DE',
    region: 'North Rhine-Westphalia',
    city: 'Düsseldorf',
    latitude: 51.2217,
    longitude: 6.7762,
    timezone: 'Europe/Berlin',
    isp: 'Various European ISPs',
    organization: 'RIPE NCC',
    asn: 0,
    asnOrganization: 'RIPE NCC',
    connectionType: 'business'
  },

  // Asian ranges
  {
    startIP: '103.0.0.0',
    endIP: '103.255.255.255',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Central Singapore',
    city: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore',
    isp: 'Various Asian ISPs',
    organization: 'APNIC',
    asn: 0,
    asnOrganization: 'APNIC',
    connectionType: 'business'
  },

  // Canadian ranges
  {
    startIP: '142.0.0.0',
    endIP: '142.255.255.255',
    country: 'Canada',
    countryCode: 'CA',
    region: 'Ontario',
    city: 'Toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    timezone: 'America/Toronto',
    isp: 'Various Canadian ISPs',
    organization: 'ARIN',
    asn: 0,
    asnOrganization: 'ARIN',
    connectionType: 'residential'
  },

  // Australian ranges
  {
    startIP: '1.128.0.0',
    endIP: '1.159.255.255',
    country: 'Australia',
    countryCode: 'AU',
    region: 'New South Wales',
    city: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
    isp: 'Telstra Corporation',
    organization: 'Telstra Internet',
    asn: 1221,
    asnOrganization: 'Telstra Corporation',
    connectionType: 'residential'
  },

  // UK ranges
  {
    startIP: '81.0.0.0',
    endIP: '81.255.255.255',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'England',
    city: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    isp: 'BT Group',
    organization: 'British Telecom',
    asn: 2856,
    asnOrganization: 'BT Group',
    connectionType: 'residential'
  },

  // Japanese ranges
  {
    startIP: '126.0.0.0',
    endIP: '126.255.255.255',
    country: 'Japan',
    countryCode: 'JP',
    region: 'Tokyo',
    city: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    isp: 'NTT Communications',
    organization: 'NTT Communications Corporation',
    asn: 4713,
    asnOrganization: 'NTT Communications',
    connectionType: 'business'
  },

  // Brazilian ranges
  {
    startIP: '200.0.0.0',
    endIP: '200.255.255.255',
    country: 'Brazil',
    countryCode: 'BR',
    region: 'São Paulo',
    city: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: 'America/Sao_Paulo',
    isp: 'Various Brazilian ISPs',
    organization: 'LACNIC',
    asn: 0,
    asnOrganization: 'LACNIC',
    connectionType: 'residential'
  },

  // Indian ranges
  {
    startIP: '117.0.0.0',
    endIP: '117.255.255.255',
    country: 'India',
    countryCode: 'IN',
    region: 'Maharashtra',
    city: 'Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    isp: 'Bharti Airtel',
    organization: 'Bharti Airtel Limited',
    asn: 9498,
    asnOrganization: 'Bharti Airtel Limited',
    connectionType: 'mobile'
  }
];

// Country information database
export const COUNTRY_INFO = {
  US: {
    name: 'United States',
    continent: 'North America',
    currency: 'USD',
    languages: ['en'],
    callingCode: '+1'
  },
  DE: {
    name: 'Germany',
    continent: 'Europe',
    currency: 'EUR',
    languages: ['de'],
    callingCode: '+49'
  },
  SG: {
    name: 'Singapore',
    continent: 'Asia',
    currency: 'SGD',
    languages: ['en', 'ms', 'ta', 'zh'],
    callingCode: '+65'
  },
  CA: {
    name: 'Canada',
    continent: 'North America',
    currency: 'CAD',
    languages: ['en', 'fr'],
    callingCode: '+1'
  },
  AU: {
    name: 'Australia',
    continent: 'Oceania',
    currency: 'AUD',
    languages: ['en'],
    callingCode: '+61'
  },
  GB: {
    name: 'United Kingdom',
    continent: 'Europe',
    currency: 'GBP',
    languages: ['en'],
    callingCode: '+44'
  },
  JP: {
    name: 'Japan',
    continent: 'Asia',
    currency: 'JPY',
    languages: ['ja'],
    callingCode: '+81'
  },
  BR: {
    name: 'Brazil',
    continent: 'South America',
    currency: 'BRL',
    languages: ['pt'],
    callingCode: '+55'
  },
  IN: {
    name: 'India',
    continent: 'Asia',
    currency: 'INR',
    languages: ['hi', 'en'],
    callingCode: '+91'
  }
};
