import { useCallback } from 'react';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import { EE } from 'utils/event';

const useOpenGuardianApprove = () => {
  const { isManagerReadOnly, guardianListForFirstNeed, walletType } = useGetState();
  const openGuardianApprove = useCallback(() => {
    console.log(
      'wfs----LoadingModal---useOpenGuardianApprove',
      isManagerReadOnly,
      guardianListForFirstNeed?.length === 0,
      walletType,
    );
    const shouldOpen = isManagerReadOnly && guardianListForFirstNeed?.length === 0 && walletType === WalletType.portkey;
    if (shouldOpen) {
      EE.emit('SET_GUARDIAN_APPROVAL_MODAL', true);
    }
    return shouldOpen;
  }, [guardianListForFirstNeed?.length, isManagerReadOnly, walletType]);

  return { openGuardianApprove };
};

export default useOpenGuardianApprove;
