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
    ]),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;