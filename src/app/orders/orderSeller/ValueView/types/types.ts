export type PaymentMethod = "efectivo" | "transferencia" | "cheque";

export type ValueItem = {
  /** Monto imputable. Para cheques, es el NETO (original - interés). */
  amount: string;
  /** Solo cheques: monto original ingresado por el usuario. */
  raw_amount?: string;
  selectedReason: string;
  method: PaymentMethod;
  bank?: string;
  /** Solo cheques: fecha de cobro (YYYY-MM-DD) */
  chequeDate?: string;
  chequeNumber?: string;
  receiptUrl?: string;
  receiptOriginalName?: string;
  overrideGraceDays?: number; // solo cheques
  cf?: number; // costo financiero pre-calculado
};

export type RowErrors = {
  bank: boolean;
  chequeNumber: boolean;
  chequeDate: boolean;
  amount: boolean;
};

export type ChequeCalculationResult = {
  neto: number;
  int$: number;
};

export type ChequePromoItem = {
  rate: number;
  amount: number;
};

export type PaymentTotals = {
  totalNominalValues: number;
  totalValues: number;
  totalChequeInterest: number;
  totalChequePromo: number;
  netEffectivePayment: number;
  totalDescCostF: number;
  saldoUI: number;
  hasExactRefi: boolean;
  hasSaldoRefi: boolean;
  hasAnyRefi: boolean;
};
