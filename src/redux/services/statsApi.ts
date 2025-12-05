// src/redux/services/statsApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum PeriodType {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  CUSTOM = "custom",
}

export interface StatsQueryParams {
  periodType: PeriodType;
  startDate?: string;
  endDate?: string;
  compareStartDate?: string;
  compareEndDate?: string;
  sellerId?: string;
  branchId?: string;
  customerId?: string;
  brandId?: string;
}

// General Stats Types
export interface GeneralStats {
  totalSales: number;
  totalNetAmount: number;
  documentCount: number;
  averageTicket: number;
  totalBalance: number;
  profitMargin: number;
}

export interface GeneralStatsWithComparison {
  current: GeneralStats;
  compare: GeneralStats | null;
  variation: {
    totalSales: number;
    documentCount: number;
    averageTicket: number;
  } | null;
}

// Seller Stats Types
export interface BrandSale {
  brandId: string;
  totalSales: number;
}

export interface TargetCompletion {
  target: number;
  actual: number;
  percentage: number;
  difference: number;
}

export interface SellerStat {
  sellerId: string;
  sellerName?: string;
  totalSales: number;
  totalNetAmount: number;
  documentCount: number;
  customerCount: number;
  averageTicket: number;
  overallTargetCompletion?: number;
  targets?: Record<string, string>;
  targetCompletion?: Record<string, TargetCompletion>;
  brandSales: BrandSale[];
}

export interface SellerStatsResponse {
  current: SellerStat[];
  compare: SellerStat[] | null;
}

// Customer Stats Types
export interface TopCustomer {
  customerId: string;
  customerName: string;
  locality: string;
  state: string;
  totalPurchases: number;
  documentCount: number;
  totalBalance: number;
  averageTicket: number;
}

export interface GeographicDistribution {
  state: string;
  locality: string;
  totalSales: number;
  customerCount: number;
}

export interface CustomerWithDebt {
  customerId: string;
  customerName: string;
  locality: string;
  state: string;
  totalDebt: number;
}

export interface CustomerStats {
  topCustomers: TopCustomer[];
  geographicDistribution: GeographicDistribution[];
  customersWithDebt: CustomerWithDebt[];
}

// Product Stats Types
export interface TopProduct {
  articleId: string;
  totalQuantity: number;
  totalSales: number;
  documentCount: number;
  brandId: string;
  supplier: string;
}

export interface BrandSales {
  brandId: string;
  totalSales: number;
  totalQuantity: number;
  productCount: number;
}

export interface TopMarginProduct {
  articleId: string;
  avgMargin: number;
  totalSales: number;
  brandId: string;
}

export interface ProductStats {
  topProducts: TopProduct[];
  salesByBrand: BrandSales[];
  topMarginProducts: TopMarginProduct[];
}

// Financial Stats Types
export interface PaymentCondition {
  _id: string;
  count: number;
  totalAmount: number;
}

export interface FinancialStats {
  totalBalance: number;
  totalAmount: number;
  totalNetAmount: number;
  totalDiscount: number;
  discountPercentage: number;
  expiredBalance: number;
  expiredDocumentCount: number;
  collectionRate: number;
  paymentConditions: PaymentCondition[];
}

// Order Stats Types
export interface OrderByStatus {
  _id: string;
  count: number;
  totalAmount: number;
}

export interface InsituStat {
  _id: boolean;
  count: number;
  totalAmount: number;
}

export interface OrderStats {
  ordersByStatus: OrderByStatus[];
  insituStats: InsituStat[];
  totalOrders: number;
  chargedOrders: number;
  conversionRate: number;
}

// Payment Stats Types
export interface PaymentStats {
  totalPayments: number;
  paymentCount: number;
}

// Complete Stats Response
export interface Period {
  type: PeriodType;
  startDate?: string;
  endDate?: string;
  compareStartDate?: string;
  compareEndDate?: string;
}

export interface CompleteStatsResponse {
  period: Period;
  general: GeneralStatsWithComparison;
  sellers: SellerStatsResponse;
  customers: CustomerStats;
  products: ProductStats;
  financial: FinancialStats;
  orders: OrderStats;
  payments: PaymentStats;
}

// Targets Response
export interface TargetSummary {
  totalTarget: number;
  totalAchieved: number;
  brandsMetTarget: number;
  totalBrands: number;
}

export interface SellerTargetResponse {
  sellerId: string;
  sellerName?: string;
  totalSales: number;
  overallTargetCompletion?: number;
  targetsByBrand?: Record<string, TargetCompletion>;
  summary: TargetSummary;
}

export interface TargetsResponse {
  period: Period;
  sellers: SellerTargetResponse[];
}

// Simplified Responses for specific endpoints
export interface SellersOnlyResponse {
  period: Period;
  sellers: SellerStatsResponse;
}

export interface FinancialOnlyResponse {
  period: Period;
  financial: FinancialStats;
}

export interface ProductsOnlyResponse {
  period: Period;
  products: ProductStats;
}

export interface CustomersOnlyResponse {
  period: Period;
  customers: CustomerStats;
}

// ============================================================================
// API DEFINITION
// ============================================================================

export const statsApi = createApi({
  reducerPath: "statsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_URL_BACKEND || "http://localhost:3000",
    prepareHeaders: (headers) => {
      // Agregar token si existe
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Stats", "Sellers", "Customers", "Products", "Financial", "Targets"],
  endpoints: (builder) => ({
    // ========================================================================
    // GET ALL STATS - Endpoint principal con todas las estadísticas
    // ========================================================================
    getStats: builder.query<CompleteStatsResponse, StatsQueryParams>({
      query: (params) => ({
        url: "/stats",
        params: {
          periodType: params.periodType,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.compareStartDate && { compareStartDate: params.compareStartDate }),
          ...(params.compareEndDate && { compareEndDate: params.compareEndDate }),
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.customerId && { customerId: params.customerId }),
          ...(params.brandId && { brandId: params.brandId }),
        },
      }),
      providesTags: ["Stats"],
    }),

    // ========================================================================
    // SELLER STATS - Estadísticas específicas de vendedores
    // ========================================================================
    getSellerStats: builder.query<SellersOnlyResponse, StatsQueryParams>({
      query: (params) => ({
        url: "/stats/sellers",
        params: {
          periodType: params.periodType,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.compareStartDate && { compareStartDate: params.compareStartDate }),
          ...(params.compareEndDate && { compareEndDate: params.compareEndDate }),
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.branchId && { branchId: params.branchId }),
        },
      }),
      providesTags: ["Sellers"],
    }),

    // ========================================================================
    // TARGETS - Cumplimiento de targets mensuales
    // ========================================================================
    getTargets: builder.query<TargetsResponse, StatsQueryParams>({
      query: (params) => ({
        url: "/stats/targets",
        params: {
          periodType: params.periodType || PeriodType.MONTH,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.branchId && { branchId: params.branchId }),
        },
      }),
      providesTags: ["Targets"],
    }),

    // ========================================================================
    // COMPARISON - Comparación entre dos períodos
    // ========================================================================
    getComparison: builder.query<CompleteStatsResponse, StatsQueryParams>({
      query: (params) => {
        if (!params.compareStartDate || !params.compareEndDate) {
          throw new Error("compareStartDate y compareEndDate son requeridos");
        }
        return {
          url: "/stats/comparison",
          params: {
            periodType: params.periodType,
            startDate: params.startDate,
            endDate: params.endDate,
            compareStartDate: params.compareStartDate,
            compareEndDate: params.compareEndDate,
            ...(params.sellerId && { sellerId: params.sellerId }),
            ...(params.branchId && { branchId: params.branchId }),
          },
        };
      },
      providesTags: ["Stats"],
    }),

    // ========================================================================
    // FINANCIAL STATS - Estadísticas financieras
    // ========================================================================
    getFinancialStats: builder.query<FinancialOnlyResponse, StatsQueryParams>({
      query: (params) => ({
        url: "/stats/financial",
        params: {
          periodType: params.periodType,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.branchId && { branchId: params.branchId }),
        },
      }),
      providesTags: ["Financial"],
    }),

    // ========================================================================
    // PRODUCT STATS - Estadísticas de productos
    // ========================================================================
    getProductStats: builder.query<ProductsOnlyResponse, StatsQueryParams>({
      query: (params) => ({
        url: "/stats/products",
        params: {
          periodType: params.periodType,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.brandId && { brandId: params.brandId }),
        },
      }),
      providesTags: ["Products"],
    }),

    // ========================================================================
    // CUSTOMER STATS - Estadísticas de clientes
    // ========================================================================
    getCustomerStats: builder.query<CustomersOnlyResponse, StatsQueryParams>({
      query: (params) => ({
        url: "/stats/customers",
        params: {
          periodType: params.periodType,
          ...(params.startDate && { startDate: params.startDate }),
          ...(params.endDate && { endDate: params.endDate }),
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.customerId && { customerId: params.customerId }),
        },
      }),
      providesTags: ["Customers"],
    }),
  }),
});

// ============================================================================
// EXPORT HOOKS
// ============================================================================

export const {
  useGetStatsQuery,
  useLazyGetStatsQuery,
  useGetSellerStatsQuery,
  useLazyGetSellerStatsQuery,
  useGetTargetsQuery,
  useLazyGetTargetsQuery,
  useGetComparisonQuery,
  useLazyGetComparisonQuery,
  useGetFinancialStatsQuery,
  useLazyGetFinancialStatsQuery,
  useGetProductStatsQuery,
  useLazyGetProductStatsQuery,
  useGetCustomerStatsQuery,
  useLazyGetCustomerStatsQuery,
} = statsApi;