export type CarStatus = "disponibil" | "rezervat" | "vandut" | "nou-sosit" | "in-curand";

export interface CarImage {
  id: string;
  car_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  r2_key?: string | null;
}

export interface Car {
  id: string;
  slug: string;
  brand: string;
  model: string;
  autovit_url: string | null;
  version: string | null;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  engine_size: number | null;
  power: number | null;
  body_type: string | null;
  color: string | null;
  description: string | null;
  equipment: string[];
  status: CarStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images?: CarImage[];
}

export interface Lead {
  id: string;
  car_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string | null;
  status: "nou" | "contactat" | "inchis";
  created_at: string;
}

export interface AboutPage {
  hero_title: string;
  intro: string;
  seo_title: string;
  seo_description: string;
}

export type ImagePosition = "left" | "right" | "top" | "none";

export interface AboutSection {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  image_r2_key: string | null;
  image_alt: string | null;
  image_position: ImagePosition;
  sort_order: number;
  is_published: boolean;
}

export interface SiteSettings {
  id: string;
  contact_email: string;
  phone: string;
  phone_display: string;
  whatsapp: string;
  opening_hours: { day: string; value: string }[];
  social_links: { key: string; label: string; url: string; enabled: boolean }[];
  created_at: string;
  updated_at: string;
}
