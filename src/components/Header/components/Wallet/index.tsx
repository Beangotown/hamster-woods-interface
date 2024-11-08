import { getHamsterPassClaimClaimable } from 'api/request';
import LoadingModal from 'components/LoadingModal';
import { useAddress } from 'hooks/useAddress';
import useOpenGuardianApprove from 'hooks/useOpenGuardianApprove';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import showMessage from 'utils/setGlobalComponentsInfo';
import {
  clearManagerReadonlyStatusInMainChain,
  clearManagerReadonlyStatusInSideChain,
} from 'utils/clearManagerReadonlyStatus';
import { store } from 'redux/store';
import { setCurrentFnAfterApprove } from 'redux/reducer/info';
import { CurrentFnAfterApproveType } from 'redux/types/reducerTypes';

export default function Wallet() {
  const {
    isMobile,
    isOnChainLogin,
    walletType,
    needSync,
    walletInfo,
    isManagerReadOnly,
    guardianListForFirstNeed,
    guardianListForFirstNeedForAssetEntrance,
  } = useGetState();
  const [syncLoading, setSyncLoading] = useState(false);
  const { openGuardianApprove } = useOpenGuardianApprove();

  const router = useRouter();

  const address = useAddress();

  const checkAccountInitStatus = useCallback(async () => {
    if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
      return setSyncLoading(true);
    }
    if (openGuardianApprove()) {
      return;
    }
    await clearManagerReadonlyStatusInMainChain(
      walletInfo?.portkeyInfo?.caInfo?.caAddress,
      walletInfo?.portkeyInfo?.caInfo?.caHash,
      guardianListForFirstNeed,
    );
    await clearManagerReadonlyStatusInSideChain(
      walletInfo?.portkeyInfo?.caInfo?.caAddress,
      walletInfo?.portkeyInfo?.caInfo?.caHash,
      guardianListForFirstNeedForAssetEntrance,
    );

    console.log(
      'wfs----LoadingModal---checkAccountInitStatus',
      isMobile,
      isOnChainLogin,
      walletType,
      needSync,
      walletInfo,
      isManagerReadOnly,
    );

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
  }, [
    address,
    guardianListForFirstNeed,
    guardianListForFirstNeedForAssetEntrance,
    isManagerReadOnly,
    isMobile,
    isOnChainLogin,
    needSync,
    openGuardianApprove,
    walletInfo,
    walletType,
  ]);

  const handleAsset = async () => {
    store.dispatch(setCurrentFnAfterApprove(CurrentFnAfterApproveType.TOKEN));
    const isAbleInit = await checkAccountInitStatus();
    isAbleInit && router.push('/asset');
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
