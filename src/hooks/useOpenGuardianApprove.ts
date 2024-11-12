import { useCallback } from 'react';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import { EE } from 'utils/event';
import showMessage from 'utils/setGlobalComponentsInfo';

const useOpenGuardianApprove = () => {
  const { isManagerReadOnly, guardianListForFirstNeed, walletType, isManagerReadOnlyIsExecuteEnd } = useGetState();
  const openGuardianApprove = useCallback(() => {
    console.log(
      'wfs----LoadingModal---useOpenGuardianApprove11',
      isManagerReadOnly,
      guardianListForFirstNeed?.length === 0,
      walletType,
      isManagerReadOnlyIsExecuteEnd,
    );
    if (!isManagerReadOnlyIsExecuteEnd && walletType === WalletType.portkey) {
      showMessage.loading();
      return true;
    } else {
      showMessage.hideLoading();
    }
    const shouldOpen = isManagerReadOnly && guardianListForFirstNeed?.length === 0 && walletType === WalletType.portkey;
    if (shouldOpen) {
      EE.emit('SET_GUARDIAN_APPROVAL_MODAL', true);
    }
    return shouldOpen;
  }, [guardianListForFirstNeed?.length, isManagerReadOnly, walletType, isManagerReadOnlyIsExecuteEnd]);

  return { openGuardianApprove };
};

export default useOpenGuardianApprove;
