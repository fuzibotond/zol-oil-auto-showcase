export type CarStatus = "disponibil" | "rezervat" | "vandut" | "nou-sosit" | "in-curand";

export interface CarImage {
  id: string;
  car_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Car {
  id: string;
  slug: string;
  brand: string;
  model: string;
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
