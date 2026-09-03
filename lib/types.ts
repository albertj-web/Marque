export type VehicleStatus = 'available' | 'reserved' | 'sold' | 'rented';
export type VehicleCategory = 'import' | 'private-sale' | 'rental' | 'motorbike';
export type LoanStatus = 'active' | 'completed' | 'defaulted';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  vin: string | null;
  reg_no: string | null;
  chassis_no: string | null;
  engine_no: string | null;
  price: number;
  status: VehicleStatus;
  category: VehicleCategory;
  colour: string | null;
  fuel_type: string | null;
  engine_capacity: string | null;
  mileage: number | null;
  description: string | null;
  images: string[];
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  address: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  vehicle_price: number;
  deposit: number;
  balance: number;
  duration_months: number;
  interest_rate: number;
  monthly_payment: number;
  remaining_balance: number;
  status: LoanStatus;
  start_date: string | null;
  contract_date: string | null;
  deposit_date: string | null;
  witness_name: string | null;
  witness_id_number: string | null;
  witness_phone: string | null;
  created_at: string;
}

export interface BalanceItem {
  id: string;
  loan_id: string;
  description: string;
  amount: number;
  due_date: string | null;
  sort_order: number;
}

export interface Payment {
  id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  remaining_after: number;
  created_at: string;
}

export interface LoanWithRelations extends Loan {
  customer: Customer | null;
  vehicle: Vehicle | null;
  balance_items: BalanceItem[];
  payments: Payment[];
}
