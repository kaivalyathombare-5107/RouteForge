// src/types/profile.ts

export type AgeGroup = '18-25' | '26-35' | '36-50' | '51-65' | '65+';

export type PreferredCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export type TravelBudget = 'economy' | 'premium' | 'luxury' | 'ultra_hni';

export type PreferredTransport = 'flight' | 'train' | 'multimodal' | 'private_charter';

export type PreferredCabinClass = 
  | 'economy' 
  | 'premium_economy' 
  | 'business' 
  | 'first' 
  | 'vande_bharat_exec';

export type SeatPreference = 'window' | 'aisle' | 'coupe' | 'extra_legroom';

export type HotelCategory = 
  | 'heritage_palace' 
  | '5_star_luxury' 
  | 'boutique_resort' 
  | 'business_executive';

export type PreferredDepartureTime = 
  | 'early_morning' // 04:00 - 08:00
  | 'morning'       // 08:00 - 12:00
  | 'afternoon'     // 12:00 - 17:00
  | 'evening'       // 17:00 - 21:00
  | 'night';        // 21:00 - 04:00

export type FlexibilityPreference = 'strict' | 'moderate' | 'high';

export type FoodPreference = 
  | 'pure_veg' 
  | 'jain' 
  | 'non_veg' 
  | 'halal' 
  | 'kosher' 
  | 'diabetic' 
  | 'none';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface FrequentTravellerIdentifiers {
  airIndia?: string;
  indigo?: string;
  irctc?: string;
  tajInnerCircle?: string;
  marriottBonvoy?: string;
  [key: string]: string | undefined;
}

export interface TravelPreferences {
  travelBudget: TravelBudget;
  preferredTransport: PreferredTransport;
  preferredCabinClass: PreferredCabinClass;
  seatPreference: SeatPreference;
  hotelCategory: HotelCategory;
  preferredDepartureTime: PreferredDepartureTime;
  maxTravelDurationHours: number;
  maxConnections: number;
  flexibilityPreference: FlexibilityPreference;
}

export interface TravellerProfile {
  // Required
  fullName: string;
  phoneNumber: string;
  homeCity: string;
  ageGroup?: AgeGroup;
  preferredCurrency?: PreferredCurrency;

  // Travel Preferences
  preferences?: TravelPreferences;

  // Optional
  foodPreference?: FoodPreference;
  accessibilityRequirements?: string;
  frequentTravellerIdentifiers?: FrequentTravellerIdentifiers;
  emergencyContact?: EmergencyContact;

  // Metadata
  userId?: string;
  userEmail?: string;
  isComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
