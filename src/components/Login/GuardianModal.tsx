import {
  AddManagerType,
  NetworkType,
  GuardianApprovalModal,
  getOperationDetails,
  ConfigProvider,
  useMultiVerify,
  useLoginWallet,
  DIDWalletInfo,
} from '@portkey/did-ui-react';
import { useState, useEffect, useCallback, memo } from 'react';
import { EE } from 'utils/event';
import { OperationTypeEnum } from 'types/index';
import { ChainId } from '@portkey/types';
import { DEFAULT_PIN } from 'constants/login';
import { WalletType } from 'constants/index';
import { AccountType, GuardiansApproved } from '@portkey/services';
import useWebLogin from 'hooks/useWebLogin';
import { dispatch, store } from 'redux/store';
import { setGuardianListForFirstNeed } from 'redux/reducer/info';

interface IGuardianModalProps {
  networkType: string;
  caHash: string;
  originChainId: ChainId;
  targetChainId: ChainId;
}
const GuardianModal = ({ networkType, caHash, originChainId, targetChainId }: IGuardianModalProps) => {
  const [showGuardianApprovalModal, setShowGuardianApprovalModal] = useState(false);

  // const multiVerify = useMultiVerify();

  // const createWallet = useLoginWallet();

  const guardianList = JSON.parse(localStorage.getItem('guardianList') || '[]');
  // console.log('wfs----guardianList in GuardianModal', guardianList);
  // console.log('wfs----networkType', networkType);
  // console.log('wfs----caHash', caHash);
  console.log('wfs----LoadingModal----originChainId-', originChainId);

  // const { handleOnChainFinish } = useWebLogin({
  //   signHandle: {},
  // });

  useEffect(() => {
    const setGuardianApproveHandler = (isShow: boolean) => {
      setShowGuardianApprovalModal(isShow);
    };
    EE.on('SET_GUARDIAN_APPROVAL_MODAL', setGuardianApproveHandler);
    return () => {
      EE.off('SET_GUARDIAN_APPROVAL_MODAL', setGuardianApproveHandler);
    };
  }, []);

  // const handleOnChainFinishWrapper = useCallback(
  //   async (wallet: DIDWalletInfo) => {
  //     if (wallet.createType !== 'recovery') {
  //       handlePortKeyLoginFinish(wallet);
  //       return;
  //     }
  //     await handleOnChainFinish(WalletType.portkey, wallet);
  //   },
  //   [handleOnChainFinish],
  // );

  const onTGSignInApprovalSuccess = useCallback(async (guardian: any) => {
    console.log('wfs----LoadingModal--onTGSignInApprovalSuccess', guardian);
    setShowGuardianApprovalModal(false);
    store.dispatch(setGuardianListForFirstNeed(guardian));
    // ConfigProvider.setGlobalConfig({
    //   globalLoadingHandler: {
    //     onSetLoading: (loadingInfo) => {
    //       console.log(loadingInfo, 'loadingInfo===');
    //     },
    //   },
    // });
    // setShowGuardianApprovalModal(false);
    // const params = {
    //   pin: DEFAULT_PIN,
    //   type: 'recovery' as AddManagerType,
    //   chainId: originChainId,
    //   accountType: 'Telegram' as AccountType,
    //   guardianIdentifier: localStorage.getItem('identifierRef') || '',
    //   guardianApprovedList: guardian,
    //   source: 5,
    // };
    // const didWallet = await createWallet(params);
    // didWallet && handleOnChainFinishWrapper(didWallet);
  }, []);

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
