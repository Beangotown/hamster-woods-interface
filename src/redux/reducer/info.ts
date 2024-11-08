import { createSlice } from '@reduxjs/toolkit';
import { AppState } from 'redux/store';
import { HYDRATE } from 'next-redux-wrapper';
import { InfoStateType, LoginStatus } from 'redux/types/reducerTypes';
import { WalletType } from 'types';
import { CurrentFnAfterApproveType } from 'redux/types/reducerTypes';

const initialState: InfoStateType = {
  isMobile: false,
  baseInfo: {
    rpcUrl: '',
  },
  theme: 'light',
  walletInfo: null,
  walletType: WalletType.unknown,
  accountInfoSync: null,
  loginStatus: LoginStatus.UNLOGIN,
  showLeaderboard: false,
  showTaskModal: false,
  showLeaderboardInfo: false,
  showGameRecord: false,
  assetVisible: false,
  isNeedSyncAccountInfo: true,
  loadingCountdown: 0,
  isManagerReadOnly: false,
  guardianListForFirstNeed: [],
  guardianListForFirstNeedForAssetEntrance: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  currentFnAfterApprove: CurrentFnAfterApproveType.NONE,
};

// Actual Slice
export const infoSlice = createSlice({
  name: 'info',
  initialState,
  reducers: {
    setIsMobile(state, action) {
      state.isMobile = action.payload;
    },
    setWalletInfo(state, action) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const { keyPair, childWallet, ...restWalletInfo } = action.payload.portkeyInfo.walletInfo;
      // action.payload.portkeyInfo.walletInfo = restWalletInfo;
      state.walletInfo = action.payload;
    },
    setWalletType(state, action) {
      state.walletType = action.payload;
    },
    setLoginStatus(state, action) {
      console.log('wfs setLoginStatus state', state, 'action.payload', action.payload);
      state.loginStatus = action.payload;
    },
    setAccountInfoSync(state, action) {
      state.accountInfoSync = action.payload;
    },
    setPlayerInfo(state, action) {
      state.playerInfo = action.payload;
    },
    toggleShowLeaderboard(state) {
      state.showLeaderboard = !state.showLeaderboard;
    },
    toggleShowTaskModal(state) {
      state.showTaskModal = !state.showTaskModal;
    },
    toggleShowLeaderboardInfo(state) {
      state.showLeaderboardInfo = !state.showLeaderboardInfo;
    },
    toggleShowGameRecord(state) {
      state.showGameRecord = !state.showGameRecord;
    },
    setAssetVisible(state, action) {
      state.assetVisible = action.payload;
    },
    setGameSetting(state, action) {
      state.gameSetting = action.payload;
    },
    setIsNeedSyncAccountInfo(state, action) {
      state.isNeedSyncAccountInfo = action.payload;
    },
    setLoadingCountdown(state, action) {
      state.loadingCountdown = action.payload;
    },
    setCurBeanPass(state, action) {
      state.curBeanPass = action.payload;
    },
    setIsManagerReadOnly(state, action) {
      state.isManagerReadOnly = action.payload;
    },
    setGuardianListForFirstNeed(state, action) {
      state.guardianListForFirstNeed = action.payload;
    },
    setGuardianListForFirstNeedForAssetEntrance(state, action) {
      state.guardianListForFirstNeedForAssetEntrance = action.payload;
    },
    setCurrentFnAfterApprove(state, action) {
      state.currentFnAfterApprove = action.payload;
    },
  },

  // Special reducer for hydrating the state. Special case for next-redux-wrapper
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.info,
      };
    },
  },
});

export const {
  setIsMobile,
  setLoginStatus,
  setWalletInfo,
  setAccountInfoSync,
  setWalletType,
  setPlayerInfo,
  toggleShowLeaderboard,
  toggleShowTaskModal,
  toggleShowLeaderboardInfo,
  toggleShowGameRecord,
  setAssetVisible,
  setGameSetting,
  setIsNeedSyncAccountInfo,
  setLoadingCountdown,
  setCurBeanPass,
  setIsManagerReadOnly,
  setGuardianListForFirstNeed,
  setGuardianListForFirstNeedForAssetEntrance,
  setCurrentFnAfterApprove,
} = infoSlice.actions;
export const selectInfo = (state: AppState) => state.info;
export default infoSlice.reducer;
