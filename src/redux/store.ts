import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { customerApi } from "./services/customersApi";
import { usersApi } from "./services/usersApi";
import { articlesApi } from "./services/articlesApi";
import { brandsApi } from "./services/brandsApi";
import { itemsApi } from "./services/itemsApi";
import { paymentConditionsApi } from "./services/paymentConditionsApi";
import { stockApi } from "./services/stockApi";
import { branchesApi } from "./services/branchesApi";
import { transportsApi } from "./services/transportsApi";
import { sellersApi } from "./services/sellersApi";
import { articlesBonusesApi } from "./services/articlesBonusesApi";
import { articlesDiscountsApi } from "./services/articlesDiscounts";
import { articlesEquivalencesApi } from "./services/articlesEquivalences";
import { articlesPricesApi } from "./services/articlesPricesApi";
import { articlesTechnicalDetailsApi } from "./services/articlesTechnicalDetailsApi";
import { articlesVehiclesApi } from "./services/articlesVehicles";
import { collectionsPaymentsTypesApi } from "./services/collectionsPaymentsTypes";
import { crmPrenotesApi } from "./services/crmPrenotes";
import { customersInformationsApi } from "./services/customersInformations";
import { customersTransportsApi } from "./services/customersTransports";
import { documentsApi } from "./services/documentsApi";
import { documentsDetailsApi } from "./services/documentsDetailsApi";
import { pendingsApi } from "./services/pendingsApi";
import { pricesListsApi } from "./services/pricesListsApi";
import { reclaimsTypesApi } from "./services/reclaimsTypes";
import { technicalDetailsApi } from "./services/technicalDetails";
import { faqsApi } from "./services/faqsApi";
import { reclaimsApi } from "./services/reclaimsApi";
import { notificationsApi } from "./services/notificationsApi";
import { marketingApi } from "./services/marketingApi";
import { collectionsApi } from "./services/collectionsApi";

export const store = configureStore({
  reducer: {
    customerApi: customerApi.reducer,
    usersApi: usersApi.reducer,
    articlesApi: articlesApi.reducer,
    brandsApi: brandsApi.reducer,
    itemsApi: itemsApi.reducer,
    paymentConditionsApi: paymentConditionsApi.reducer,
    stockApi: stockApi.reducer,
    branchesApi: branchesApi.reducer,
    transportsApi: transportsApi.reducer,
    sellersApi: sellersApi.reducer,
    articlesBonusesApi: articlesBonusesApi.reducer,
    articlesDiscountsApi: articlesDiscountsApi.reducer,
    articlesEquivalencesApi: articlesEquivalencesApi.reducer,
    articlesPricesApi: articlesPricesApi.reducer,
    articlesTechnicalDetailsApi: articlesTechnicalDetailsApi.reducer,
    articlesVehiclesApi: articlesVehiclesApi.reducer,
    collectionsPaymentsTypesApi: collectionsPaymentsTypesApi.reducer,
    crmPrenotesApi: crmPrenotesApi.reducer,
    customersInformationsApi: customersInformationsApi.reducer,
    customersTransportsApi: customersTransportsApi.reducer,
    documentsApi: documentsApi.reducer,
    documentsDetailsApi: documentsDetailsApi.reducer,
    pendingsApi: pendingsApi.reducer,
    pricesListsApi: pricesListsApi.reducer,
    reclaimsTypesApi: reclaimsTypesApi.reducer,
    technicalDetailsApi: technicalDetailsApi.reducer,
    faqsApi: faqsApi.reducer,
    reclaimsApi: reclaimsApi.reducer,
    notificationsApi: notificationsApi.reducer,
    marketingApi: marketingApi.reducer,
    collectionsApi: collectionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      customerApi.middleware,
      usersApi.middleware,
      articlesApi.middleware,
      brandsApi.middleware,
      itemsApi.middleware,
      paymentConditionsApi.middleware,
      stockApi.middleware,
      branchesApi.middleware,
      transportsApi.middleware,
      sellersApi.middleware,
      articlesBonusesApi.middleware,
      articlesDiscountsApi.middleware,
      articlesEquivalencesApi.middleware,
      articlesPricesApi.middleware,
      articlesTechnicalDetailsApi.middleware,
      articlesVehiclesApi.middleware,
      collectionsPaymentsTypesApi.middleware,
      crmPrenotesApi.middleware,
      customersInformationsApi.middleware,
      customersTransportsApi.middleware,
      documentsApi.middleware,
      documentsDetailsApi.middleware,
      pendingsApi.middleware,
      pricesListsApi.middleware,
      reclaimsTypesApi.middleware,
      technicalDetailsApi.middleware,
      faqsApi.middleware,
      reclaimsApi.middleware,
      notificationsApi.middleware,
      marketingApi.middleware,
      collectionsApi.middleware
    ]),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
