export type ValueItem = {
  amount: string;
  raw_amount?: string;
  chequeDate?: string;
  selectedReason: string;
  method: "efectivo" | "transferencia" | "cheque";
  bank?: string;
  receiptUrl?: string;
  receiptOriginalName?: string;
  chequeNumber?: string;
  overrideGraceDays?: number;
  cf?: number;
};

export type ComputedDiscount = {
  document_id: string;
  number: string;
  days: number;
  base: number;
  rate: number;
  signedAdjustment: number;
  finalAmount: number;
  note?: string;
  noDiscountBlocked?: boolean;
  eligibleManual10?: boolean;
  manualTenApplied?: boolean;
};
