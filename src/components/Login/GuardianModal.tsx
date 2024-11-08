import { NetworkType, GuardianApprovalModal, getOperationDetails } from '@portkey/did-ui-react';
import { useState, useEffect, useCallback, memo } from 'react';
import { EE } from 'utils/event';
import { OperationTypeEnum } from 'types/index';
import { ChainId } from '@portkey/types';
import { store } from 'redux/store';
import { setGuardianListForFirstNeed, setGuardianListForFirstNeedForAssetEntrance } from 'redux/reducer/info';
import useGetState from 'redux/state/useGetState';
import { useRouter } from 'next/navigation';
import { CurrentFnAfterApproveType } from 'redux/types/reducerTypes';
import {
  clearManagerReadonlyStatusInMainChain,
  clearManagerReadonlyStatusInSideChain,
} from 'utils/clearManagerReadonlyStatus';
import showMessage from 'utils/setGlobalComponentsInfo';
import { getHamsterPassClaimClaimable } from 'api/request';

interface IGuardianModalProps {
  networkType: string;
  caHash: string;
  originChainId: ChainId;
  targetChainId: ChainId;
  go: (args?: boolean) => Promise<void>;
  getChance: (args?: boolean) => Promise<void>;
}
const GuardianModal = ({ networkType, caHash, originChainId, targetChainId, go, getChance }: IGuardianModalProps) => {
  const { currentFnAfterApprove, walletInfo } = useGetState();
  const [showGuardianApprovalModal, setShowGuardianApprovalModal] = useState(false);
  const router = useRouter();
  const guardianList = JSON.parse(localStorage.getItem('guardianList') || '[]');

  useEffect(() => {
    const setGuardianApproveHandler = (isShow: boolean) => {
      setShowGuardianApprovalModal(isShow);
    };
    EE.on('SET_GUARDIAN_APPROVAL_MODAL', setGuardianApproveHandler);
    return () => {
      EE.off('SET_GUARDIAN_APPROVAL_MODAL', setGuardianApproveHandler);
    };
  }, []);

  const toAsset = useCallback(
    async (guardian: any) => {
      let checkAccountInitStatusRes;
      showMessage.loading();
      try {
        await clearManagerReadonlyStatusInMainChain(
          walletInfo?.portkeyInfo?.caInfo?.caAddress,
          walletInfo?.portkeyInfo?.caInfo?.caHash,
          guardian,
        );
        await clearManagerReadonlyStatusInSideChain(
          walletInfo?.portkeyInfo?.caInfo?.caAddress,
          walletInfo?.portkeyInfo?.caInfo?.caHash,
          guardian,
        );
        checkAccountInitStatusRes = await getHamsterPassClaimClaimable({
          caAddress: walletInfo?.portkeyInfo?.caInfo?.caAddress ?? '',
        });
        showMessage.hideLoading();
        if (checkAccountInitStatusRes) {
          router.push('/asset');
        }
      } catch (err) {
        showMessage.hideLoading();
        console.log('checkBeanPassStatusError:', err);
        router.push('/asset');
      }
    },
    [router, walletInfo?.portkeyInfo?.caInfo?.caAddress, walletInfo?.portkeyInfo?.caInfo?.caHash],
  );

  const onTGSignInApprovalSuccess = useCallback(
    async (guardian: any) => {
      setShowGuardianApprovalModal(false);
      store.dispatch(setGuardianListForFirstNeed(guardian));
      store.dispatch(setGuardianListForFirstNeedForAssetEntrance(guardian));

      console.log('wfs----LoadingModal--onTGSignInApprovalSuccess', guardian, currentFnAfterApprove);
      switch (currentFnAfterApprove) {
        case CurrentFnAfterApproveType.GET_CHANCE:
          getChance(false);
          break;
        case CurrentFnAfterApproveType.GO:
          go(false);
          break;
        case CurrentFnAfterApproveType.TOKEN:
          toAsset(guardian);
          break;
        default:
          break;
      }
    },
    [currentFnAfterApprove, getChance, go, toAsset],
  );

  return (
    <GuardianApprovalModal
      open={showGuardianApprovalModal}
      // isAsyncVerify
      networkType={networkType as NetworkType}
      caHash={caHash}
      originChainId={originChainId}
      targetChainId={targetChainId}
      guardianList={guardianList}
      operationType={OperationTypeEnum.communityRecovery}
      operationDetails={getOperationDetails(OperationTypeEnum.communityRecovery)}
      onClose={() => EE.emit('SET_GUARDIAN_APPROVAL_MODAL', false)}
      onBack={() => EE.emit('SET_GUARDIAN_APPROVAL_MODAL', false)}
      onApprovalSuccess={onTGSignInApprovalSuccess}
    />
  );
};

export default memo(GuardianModal);
