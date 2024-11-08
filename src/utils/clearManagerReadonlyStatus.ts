import { getChainInfo, did } from '@portkey/did-ui-react';
import { aelf } from '@portkey/utils';
import { getContractBasic } from '@portkey/contracts';
import { ChainId } from '@portkey/types';
import {
  setGuardianListForFirstNeed,
  setGuardianListForFirstNeedForAssetEntrance,
  setIsManagerReadOnly,
} from 'redux/reducer/info';
import { store } from 'redux/store';

const getCaContractBase = async (chainId: ChainId) => {
  const chainInfo = await getChainInfo(chainId);
  if (!chainInfo) {
    throw new Error(`Chain is not running: ${chainId}`);
  }
  const account = aelf.getWallet(did.didWallet.managementAccount?.privateKey || '');
  const caContract = await getContractBasic({
    contractAddress: chainInfo.caContractAddress,
    account,
    rpcUrl: chainInfo.endPoint,
  });
  return caContract;
};

const getCaContractBySideChain = async () => {
  const sideChain = process.env.NEXT_PUBLIC_APP_ENV === 'test' ? 'tDVW' : 'tDVV';
  const caIns = await getCaContractBase(sideChain);
  return caIns;
};

const getCaContractByMainChain = async () => {
  const caIns = await getCaContractBase('AELF');
  return caIns;
};

const clearManagerReadonlyStatusInMainChain = async (caAddress = '', caHash = '', guardiansApproved?: any[]) => {
  if (!guardiansApproved || guardiansApproved.length === 0) {
    return;
  }
  const ca = await getCaContractByMainChain();
  const rs = await ca.callSendMethod('RemoveReadOnlyManager', caAddress, {
    caHash,
    guardiansApproved: guardiansApproved,
  });
  console.log('wfs----LoadingModal---clearManagerReadonlyStatusInMainChain', caAddress, caHash, guardiansApproved, rs);
  store.dispatch(setGuardianListForFirstNeed([]));
  store.dispatch(setIsManagerReadOnly(false));
};

const clearManagerReadonlyStatusInSideChain = async (caAddress = '', caHash = '', guardiansApproved?: any[]) => {
  if (!guardiansApproved || guardiansApproved.length === 0) {
    return;
  }
  const ca = await getCaContractBySideChain();
  const rs = await ca.callSendMethod('RemoveReadOnlyManager', caAddress, {
    caHash,
    guardiansApproved: guardiansApproved,
  });
  console.log('wfs----LoadingModal---clearManagerReadonlyStatusInSideChain', caAddress, caHash, guardiansApproved, rs);
  store.dispatch(setGuardianListForFirstNeedForAssetEntrance([]));
  store.dispatch(setIsManagerReadOnly(false));
};

export { clearManagerReadonlyStatusInMainChain, clearManagerReadonlyStatusInSideChain, getCaContractBySideChain };
