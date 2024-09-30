'use client';
import Image from 'next/image';
import styles from './styles.module.css';
import { useCallback, useState } from 'react';
import CommonBtn from 'components/CommonBtn';
import { useRouter } from 'next/navigation';
import {
  KEY_NAME,
  LOGIN_EARGLY_KEY,
  PORTKEY_LOGIN_CHAIN_ID_KEY,
  PORTKEY_LOGIN_SESSION_ID_KEY,
} from 'constants/platform';
import { dispatch, store } from 'redux/store';
import {
  setIsNeedSyncAccountInfo,
  setLoginStatus,
  setPlayerInfo,
  setWalletInfo,
  setWalletType,
  toggleShowGameRecord,
} from 'redux/reducer/info';
import { LoginStatus } from 'redux/types/reducerTypes';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types/index';
import { did, singleMessage, TelegramPlatform } from '@portkey/did-ui-react';
import { ChainId } from '@portkey/provider-types';
import ContractRequest from 'contract/contractRequest';
import { setChessboardResetStart, setChessboardTotalStep, setCurChessboardNode } from 'redux/reducer/chessboardData';
import showMessage from 'utils/setGlobalComponentsInfo';
import CustomModal from 'components/CustomModal';
import CommonRedBtn from 'components/CommonRedBtn';
import { loginOptTip } from 'constants/tip';
export default function Setting() {
  const [settingModalVisible, setSettingModalVisible] = useState(false);

  const { walletType, isMobile, isOnChainLogin } = useGetState();

  const handleCancel = () => {
    setSettingModalVisible(false);
  };

  const handleRecord = () => {
    dispatch(toggleShowGameRecord());
    setSettingModalVisible(false);
  };

  const handleSetting = () => {
    setSettingModalVisible(true);
  };

  const router = useRouter();

  const handleLock = useCallback(() => {
    if (walletType === WalletType.discover) {
      return;
    }
    ContractRequest.get().resetConfig();
    did.reset();
    console.log('wfs setLoginStatus=>2');
    store.dispatch(setLoginStatus(LoginStatus.LOCK));
    store.dispatch(setCurChessboardNode(null));
    store.dispatch(setChessboardResetStart(true));
    store.dispatch(setChessboardTotalStep(0));
  }, [walletType]);

  const handleExit = async () => {
    if (!isOnChainLogin && walletType === WalletType.portkey) {
      return singleMessage.warning(loginOptTip);
    }
    showMessage.loading('Signing out of Hamster Woods');
    if (walletType === WalletType.portkey) {
      window.localStorage.removeItem(KEY_NAME);
      const originChainId = localStorage.getItem(PORTKEY_LOGIN_CHAIN_ID_KEY);
      if (originChainId) {
        try {
          await did.logout({
            chainId: originChainId as ChainId,
          });
          did.reset();
        } catch (error) {
          console.error('portkey: error', error);
        }
      }
    } else if (walletType === WalletType.discover) {
      window.localStorage.removeItem(LOGIN_EARGLY_KEY);
    }

    setSettingModalVisible(false);
    console.log('wfs setLoginStatus=>3');
    store.dispatch(setLoginStatus(LoginStatus.UNLOGIN));
    store.dispatch(setWalletInfo(null));
    store.dispatch(setWalletType(WalletType.unknown));
    store.dispatch(setPlayerInfo(null));
    store.dispatch(setCurChessboardNode(null));
    store.dispatch(setChessboardResetStart(true));
    store.dispatch(setChessboardTotalStep(0));
    store.dispatch(setIsNeedSyncAccountInfo(true));
    window.localStorage.removeItem(PORTKEY_LOGIN_CHAIN_ID_KEY);
    window.localStorage.removeItem(PORTKEY_LOGIN_SESSION_ID_KEY);
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
    </>
  );
}
