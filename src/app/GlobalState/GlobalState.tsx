"use client";

import {
  createSlice,
  PayloadAction,
  configureStore,
  combineReducers,
} from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import storage from "redux-persist/lib/storage";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import { UserState } from "../interfaces/Redux";

// Estado inicial plano
const initialState: UserState = {
  _id: "",
  fullName: "",
  email: "",
  role: [],
};

// ===================== Slice =====================
export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => action.payload,
    clearUser: () => initialState,
  },
});

export const { setUser, clearUser } = userSlice.actions;

// ===================== Persist config =====================
const persistConfig = { key: "root", storage };

// ===================== Root reducer =====================
const rootReducer = combineReducers({ user: userSlice.reducer });
const persistedReducer = persistReducer(persistConfig, rootReducer);

// ===================== Store =====================
export const store = configureStore({
  reducer: persistedReducer,
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Persistor para PersistGate
export const persistor = persistStore(store);

// ===================== Hooks tipados =====================
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
