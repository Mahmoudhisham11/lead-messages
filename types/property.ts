export type PropertyType =
  | "apartment"
  | "villa"
  | "townhouse"
  | "commercial"
  | "land";

export type PropertyAvailability =
  | "available"
  | "sold"
  | "rented"
  | "pending";

export interface Property {
  id: string;
  userId: string;
  name: string;
  location: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  images: string[];
  availability: PropertyAvailability;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}
