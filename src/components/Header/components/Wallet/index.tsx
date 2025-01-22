import { getHamsterPassClaimClaimable } from 'api/request';
import LoadingModal from 'components/LoadingModal';
import { useAddress } from 'hooks/useAddress';
// import useOpenGuardianApprove from 'hooks/useOpenGuardianApprove';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import showMessage from 'utils/setGlobalComponentsInfo';

import { store } from 'redux/store';
import { setCurrentFnAfterApprove } from 'redux/reducer/info';
import { CurrentFnAfterApproveType } from 'redux/types/reducerTypes';
import { useConnect } from '@portkey/connect-web-wallet';
import { isTelegramPlatform } from 'utils/common';

export default function Wallet() {
  const { isMobile, isOnChainLogin, walletType, needSync } = useGetState();
  const [syncLoading, setSyncLoading] = useState(false);
  // const { openGuardianApprove } = useOpenGuardianApprove();
  const { showAsset } = useConnect();

  const address = useAddress();

  const checkAccountInitStatus = useCallback(async () => {
    if ((!isOnChainLogin && walletType === WalletType.portkey && isTelegramPlatform) || needSync) {
      return setSyncLoading(true);
    }
    // if (openGuardianApprove()) {
    //   return;
    // }

    showMessage.loading();
    let checkAccountInitStatusRes;
    try {
      checkAccountInitStatusRes = await getHamsterPassClaimClaimable({
        caAddress: address,
      });
      console.log('checkAccountInitStatus', checkAccountInitStatusRes);
      showMessage.hideLoading();
    } catch (err) {
      showMessage.hideLoading();
      console.log('checkBeanPassStatusError:', err);
      return true;
    }
    if (!checkAccountInitStatusRes) return false;
    return true;
  }, [address, isOnChainLogin, needSync, walletType]);

  const handleAsset = async () => {
    store.dispatch(setCurrentFnAfterApprove(CurrentFnAfterApproveType.TOKEN));
    try {
      const isAbleInit = await checkAccountInitStatus();
      if (isAbleInit) {
        await showAsset();
      }
    } catch (error) {
      console.log('===handleAsset error', error);
    }
  };

  return (
    <>
      <Image
        src={require('assets/images/header-wallet.png')}
        alt=""
        className={`object-cover ${isMobile ? 'h-10 w-10' : 'h-20 w-20'}`}
        onClick={handleAsset}
      />
      <LoadingModal open={syncLoading} onCancel={() => setSyncLoading(false)} />
    </>
  );
}
