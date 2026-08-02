export type TemplateCategory =
  | "welcome"
  | "follow-up"
  | "luxury"
  | "apartment"
  | "villa"
  | "investment"
  | "rental"
  | "commercial"
  | "custom";

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  category: TemplateCategory;
  isFavorite: boolean;
  variables: string[];
  createdAt: Date;
  updatedAt?: Date;
}
