import { combineReducers } from 'redux';
import { useSelector as useReduxSelector, TypedUseSelectorHook } from 'react-redux';
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import InfoReducer, { infoSlice } from './reducer/info';
import GlobalComponentsInfoReducer, { globalComponentsInfoSlice } from './reducer/globalComponentsInfo';
import ConfigInfoReducer, { configInfoSlice } from './reducer/configInfo';
import ChessboardDataReducer, { chessboardDataSlice } from './reducer/chessboardData';
import ServerConfigInfoReducer, { serverConfigInfoSlice } from './reducer/serverConfigInfo';

export const rootReducer = combineReducers({
  [infoSlice.name]: InfoReducer,
  [globalComponentsInfoSlice.name]: GlobalComponentsInfoReducer,
  [configInfoSlice.name]: ConfigInfoReducer,
  [chessboardDataSlice.name]: ChessboardDataReducer,
  [serverConfigInfoSlice.name]: ServerConfigInfoReducer,
});

const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    devTools: process.env.NEXT_PUBLIC_APP_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<AppStore['getState']>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, Action>;

export const store: AppStore = makeStore();
export const dispatch: AppDispatch = store.dispatch;
export const useSelector: TypedUseSelectorHook<AppState> = useReduxSelector;
