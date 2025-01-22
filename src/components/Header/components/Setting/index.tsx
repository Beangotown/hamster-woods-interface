'use client';
import Image from 'next/image';
import styles from './styles.module.css';
import { useCallback, useState } from 'react';
import CommonBtn from 'components/CommonBtn';
import { useRouter } from 'next/navigation';
import { LOGIN_EARGLY_KEY, PORTKEY_LOGIN_CHAIN_ID_KEY, PORTKEY_LOGIN_SESSION_ID_KEY } from 'constants/platform';
import { dispatch, store } from 'redux/store';
import {
  setIsNeedSyncAccountInfo,
  setLoadingCountdown,
  setLoginStatus,
  setPlayerInfo,
  setWalletInfo,
  setWalletType,
  toggleShowGameRecord,
} from 'redux/reducer/info';
import { LoginStatus } from 'redux/types/reducerTypes';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types/index';
import { singleMessage, TelegramPlatform } from '@portkey/did-ui-react';
import { MethodsWallet } from '@portkey/provider-types';
import ContractRequest from 'contract/contractRequest';
import { setChessboardResetStart, setChessboardTotalStep, setCurChessboardNode } from 'redux/reducer/chessboardData';
import showMessage from 'utils/setGlobalComponentsInfo';
import CustomModal from 'components/CustomModal';
import CommonRedBtn from 'components/CommonRedBtn';
import LoadingModal from 'components/LoadingModal';
import { StorageUtils } from 'utils/storage.utils';
import { useConnect } from '@portkey/connect-web-wallet';
import { isTelegramPlatform } from 'utils/common';
export default function Setting() {
  const [settingModalVisible, setSettingModalVisible] = useState(false);

  const { walletType, isMobile, isOnChainLogin, needSync, isTgInit } = useGetState();
  const [syncLoading, setSyncLoading] = useState(false);
  const { disconnect, provider } = useConnect();

  const handleCancel = () => {
    setSettingModalVisible(false);
  };

  const handleRecord = () => {
    dispatch(toggleShowGameRecord());
    setSettingModalVisible(false);
  };

  const handleSetting = () => {
    if (isTgInit) return;
    setSettingModalVisible(true);
  };

  const router = useRouter();

  const handleLock = useCallback(async () => {
    if (walletType === WalletType.discover) {
      return;
    }
    ContractRequest.get().resetConfig();
    if (!provider) {
      singleMessage.error('provider is not ready');
      return;
    }
    await provider?.request({
      method: MethodsWallet.WALLET_LOCK,
      payload: { data: Date.now().toString() },
    });
    store.dispatch(setLoginStatus(LoginStatus.LOCK));
    store.dispatch(setCurChessboardNode(null));
    store.dispatch(setChessboardResetStart(true));
    store.dispatch(setChessboardTotalStep(0));
  }, [provider, walletType]);

  const handleExit = async () => {
    if (
      (!isOnChainLogin && walletType === WalletType.portkey && isTelegramPlatform && isTelegramPlatform) ||
      needSync
    ) {
      return setSyncLoading(true);
    }
    showMessage.loading('Signing out of Hamster Woods');
    if (walletType === WalletType.portkey) {
      await disconnect();
    } else if (walletType === WalletType.discover) {
      window.localStorage.removeItem(LOGIN_EARGLY_KEY);
    }
    setSettingModalVisible(false);
    StorageUtils.removeWallet();
    store.dispatch(setLoginStatus(LoginStatus.UNLOGIN));
    store.dispatch(setWalletInfo(null));
    store.dispatch(setWalletType(WalletType.unknown));
    store.dispatch(setPlayerInfo(null));
    store.dispatch(setCurChessboardNode(null));
    store.dispatch(setChessboardResetStart(true));
    store.dispatch(setChessboardTotalStep(0));
    store.dispatch(setIsNeedSyncAccountInfo(true));
    store.dispatch(setLoadingCountdown(0));
    window.localStorage.removeItem(PORTKEY_LOGIN_CHAIN_ID_KEY);
    window.localStorage.removeItem(PORTKEY_LOGIN_SESSION_ID_KEY);
    StorageUtils.removeOriginChainId();
    StorageUtils.removeSessionStorage();
    ContractRequest.get().resetConfig();
    showMessage.hideLoading();
    if (TelegramPlatform.isTelegramPlatform()) {
      TelegramPlatform.close();
      return;
    }
    router.push('/login');
  };
  return (
    <>
      <Image
        src={require('assets/images/header-setting.png')}
        alt=""
        className={isMobile ? styles.setting : styles['setting-pc']}
        onClick={handleSetting}
      />
      <CustomModal
        open={settingModalVisible}
        title="Settings"
        centered={isMobile}
        onCancel={handleCancel}
        className={`${isMobile ? '!w-[358px]' : '!w-[580px]'}`}>
        <div className="my-2 pt-4 pb-8">
          <CommonBtn
            title="Game Record"
            onClick={handleRecord}
            className={`${isMobile ? styles.buttonMobile : styles.button} mb-4 mb-[24.5px]`}></CommonBtn>
          {walletType !== WalletType.discover && !TelegramPlatform.isTelegramPlatform() && (
            <CommonBtn
              title="Lock"
              onClick={handleLock}
              className={`${isMobile ? styles.buttonMobile : styles.button} mb-4 mb-[24.5px]`}></CommonBtn>
          )}
          <CommonRedBtn
            title="Exit Game"
            onClick={handleExit}
            className={`!bg-[#F75D56] ${isMobile ? styles.buttonMobile : styles.button}`}></CommonRedBtn>
        </div>
      </CustomModal>
      <LoadingModal open={syncLoading} onCancel={() => setSyncLoading(false)} />
    </>
  );
}
