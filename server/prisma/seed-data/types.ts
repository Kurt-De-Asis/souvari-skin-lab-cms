export interface CatalogServiceInput {
  name: string;
  slug: string;
  category: string;
  description?: string;
  duration_minutes: number;
  inclusions?: string[];
  needs_verification?: boolean;
  is_bookable?: boolean;
  variants?: VariantInput[];
  prices: PriceRowInput[];
  package?: PackageInput;
  external_id?: string;
  sku?: string;
  treatment_type?: string;
  online_booking?: string;
  available_for?: string;
  voucher_sales?: string;
  commissions?: string;
}

export interface VariantInput {
  variant_key: string;
  label: string;
  duration_minutes?: number;
}

export interface PriceRowInput {
  audience: 'vip' | 'non_member' | 'regular';
  staff_tier?: string;
  gender_scope?: string;
  amount: number;
  is_available?: boolean;
  needs_verification?: boolean;
  variant_key?: string;
  source_ref?: string;
}

export interface PackageInput {
  sessions_included: number;
  session_price: number;
  ten_session_price?: number;
  inclusions?: string[];
  savings_note?: string;
}

export interface SectionDef {
  slug: string;
  name: string;
  description?: string;
  display_order: number;
  is_bookable?: boolean;
  services: CatalogServiceInput[];
}
