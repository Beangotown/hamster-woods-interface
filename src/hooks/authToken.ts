import AElf from 'aelf-sdk';
import { useCallback } from 'react';
import { recoverPubKeyBySignature } from '@etransfer/utils';
import { AuthTokenSource, PortkeyVersion } from '@etransfer/types';
import { SignatureParams } from './useWebLogin';
import { eTransferCore } from '@etransfer/core';
import { WalletType } from 'types';
import DetectProvider from 'utils/InstanceProvider';
import useGetState from 'redux/state/useGetState';
import { did } from '@portkey/did-ui-react';
import { getAwakenWalletType, getCaHashAndOriginChainIdByWallet } from 'utils/wallet';
import { getETransferJWT } from '@etransfer/utils';
import { asyncStorage } from 'utils/lib';
import { ChainId } from '@portkey/types';
import { ETransferConfig } from '@etransfer/ui-react';
import { isJWTExpired } from 'utils/common';
import { useETransferAccounts } from './useAddress';
import { StorageUtils } from 'utils/storage.utils';

export function useQueryAuthToken() {
  const { walletInfo, walletType, isLogin, isOnChainLogin } = useGetState();

  const accounts = useETransferAccounts();

  const getDiscoverSignature = useCallback(
    async (params: SignatureParams) => {
      // checkSignatureParams(params);
      const discoverInfo = walletInfo?.discoverInfo;
      if (!discoverInfo) {
        throw new Error('Discover not connected');
      }
      const discoverProvider = await DetectProvider.getDetectProvider();
      if (!discoverProvider) throw new Error('Please download extension');
      const provider = discoverProvider;
      const signInfo = params.signInfo;
      const checkMethod = (discoverProvider as any).methodCheck('wallet_getManagerSignature');
      const signedMsgObject = await provider.request({
        method: checkMethod ? 'wallet_getManagerSignature' : 'wallet_getSignature',
        payload: {
          data: signInfo || params.hexToBeSign,
        },
      });
      const signedMsgString = [
        signedMsgObject.r.toString(16, 64),
        signedMsgObject.s.toString(16, 64),
        `0${signedMsgObject.recoveryParam.toString()}`,
      ].join('');
      return {
        error: 0,
        errorMessage: '',
        signature: signedMsgString,
        from: 'discover',
      };
    },
    [walletInfo?.discoverInfo],
  );

  const getPortKeySignature = useCallback(
    async (params: SignatureParams) => {
      // checkSignatureParams(params);
      const didWalletInfo = walletInfo?.portkeyInfo;
      if (!didWalletInfo) {
        throw new Error('Portkey not login');
      }
      let signInfo = '';
      if (params.hexToBeSign) {
        signInfo = params.hexToBeSign;
      } else {
        signInfo = params.signInfo;
      }
      const signature = did.sign(signInfo).toString('hex');
      return {
        error: 0,
        errorMessage: '',
        signature,
        from: 'portkey',
      };
    },
    [walletInfo],
  );
  const handleGetSignature = useCallback(async () => {
    const plainTextOrigin = `Nonce:${Date.now()}`;
    const plainText: any = Buffer.from(plainTextOrigin).toString('hex').replace('0x', '');
    let signInfo: string;
    let getSignature;
    let address: string;
    if (walletType !== WalletType.portkey) {
      // nightElf or discover
      const discoverProvider = await DetectProvider.getDetectProvider();
      if (!discoverProvider) throw new Error('Please download extension');

      const checkMethod = (discoverProvider as any).methodCheck('wallet_getManagerSignature');
      if (checkMethod) {
        signInfo = Buffer.from(plainTextOrigin).toString('hex');
      } else {
        signInfo = AElf.utils.sha256(plainText);
      }
      getSignature = getDiscoverSignature;
      address = walletInfo?.discoverInfo?.address || '';
    } else {
      // portkey sdk
      signInfo = Buffer.from(plainText).toString('hex');
      getSignature = getPortKeySignature;
      address = walletInfo?.portkeyInfo?.walletInfo?.address || '';
    }
    console.log('getSignature');
    const result = await getSignature({
      appName: 'Hamster Woods',
      address,
      signInfo,
    });
    if (result.error) throw result.errorMessage;

    return { signature: result?.signature || '', plainText };
  }, [
    getDiscoverSignature,
    getPortKeySignature,
    walletInfo?.discoverInfo?.address,
    walletInfo?.portkeyInfo?.walletInfo?.address,
    walletType,
  ]);

  const getManagerAddress = useCallback(async () => {
    //
    let managerAddress;
    if (walletType === WalletType.discover) {
      const discoverProvider = await DetectProvider.getDetectProvider();
      if (!discoverProvider) throw new Error('Please download extension');

      managerAddress = await discoverProvider.request({ method: 'wallet_getCurrentManagerAddress' });
    } else if (walletType === WalletType.portkey) {
      managerAddress = did.didWallet.managementAccount?.address;
    }
    if (managerAddress) return managerAddress;
    throw new Error('Please Login');
  }, [walletType]);

  const getCaInfo: () => Promise<{ caHash: string; originChainId: ChainId; caAddress: string }> =
    useCallback(async () => {
      if (walletType === WalletType.portkey) {
        const originChainId = (StorageUtils.getOriginChainId() || '') as ChainId;

        const caInfo = did.didWallet.aaInfo.accountInfo ?? did.didWallet.caInfo?.[originChainId];

        console.log(caInfo, did.didWallet, ' did.didWallet.aaInfo==originChainId', 'originChainId', originChainId);

        if (!caInfo?.caHash || !caInfo?.caAddress || !originChainId) throw new Error('You are not logged in.');
        return {
          ...caInfo,
          originChainId,
        };
      } else {
        const caAddress = walletInfo?.discoverInfo?.address;
        if (!caAddress) throw new Error('You are not logged in.');
        const { caHash, originChainId } = await getCaHashAndOriginChainIdByWallet(caAddress);
        return {
          caHash,
          originChainId,
          caAddress,
        };
      }
    }, [walletInfo?.discoverInfo?.address, walletType]);

  const getUserInfo = useCallback(
    async ({
      managerAddress,
      caHash,
      originChainId,
    }: {
      managerAddress: string;
      caHash: string;
      originChainId: ChainId;
    }) => {
      const signatureResult = await handleGetSignature();
      console.log(signatureResult, 'signatureResult===');
      const pubkey = recoverPubKeyBySignature(signatureResult.plainText, signatureResult.signature) + '';

      // localStorage.setItem(ETRANSFER_USER_MANAGER_ADDRESS, managerAddress);
      console.log('>>>>>> user information:', {
        pubkey,
        signature: signatureResult.signature,
        plainText: signatureResult.plainText,
        caHash,
        originChainId,
        managerAddress,
      });

      return {
        pubkey,
        signature: signatureResult.signature,
        plainText: signatureResult.plainText,
        caHash,
        originChainId,
        managerAddress: managerAddress,
      };
    },
    [handleGetSignature],
  );

  const getETransferAuthToken = useCallback(async () => {
    if (!walletInfo) throw new Error('Failed to obtain walletInfo information.');
    if (!isLogin && !isOnChainLogin) throw new Error('You are not logged in.');
    try {
      // showMessage.loading();

      const managerAddress = await getManagerAddress();
      const { caHash, originChainId } = await getCaInfo();
      let authToken;
      const jwtData = await getETransferJWT(asyncStorage, `${caHash}${managerAddress}`);
      console.log(jwtData, 'jwtData====');
      if (jwtData && !isJWTExpired(jwtData?.expiresTime || 0)) {
        authToken = `${jwtData.token_type} ${jwtData.access_token}`;
      } else {
        const { pubkey, signature, plainText } = await getUserInfo({ managerAddress, caHash, originChainId });
        authToken = await eTransferCore.getAuthToken({
          pubkey,
          signature,
          plainText,
          caHash,
          chainId: originChainId,
          managerAddress,
          version: PortkeyVersion.v2,
          source: AuthTokenSource.Portkey,
          recaptchaToken: undefined,
        });
      }
      ETransferConfig.setConfig({
        authorization: {
          jwt: authToken,
        },
        accountInfo: {
          walletType: getAwakenWalletType(walletType),
          accounts,
        },
      });
      return authToken;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      // showMessage.hideLoading();
    }
  }, [accounts, getCaInfo, getManagerAddress, getUserInfo, isLogin, isOnChainLogin, walletInfo, walletType]);

  const getETransferAuthTokenFromApi = useCallback(async () => {
    if (!walletInfo) throw new Error('Failed to obtain walletInfo information.');
    if (!isLogin && !isOnChainLogin) throw new Error('You are not logged in.');
    try {
      const managerAddress = await getManagerAddress();
      const { caHash, originChainId } = await getCaInfo();
      const { pubkey, signature, plainText } = await getUserInfo({ managerAddress, caHash, originChainId });
      const authToken = await eTransferCore.getAuthTokenFromApi({
        pubkey,
        signature,
        plain_text: plainText,
        ca_hash: caHash,
        chain_id: originChainId,
        managerAddress,
        version: PortkeyVersion.v2,
        source: AuthTokenSource.Portkey,
        recaptchaToken: undefined,
      });

      ETransferConfig.setConfig({
        authorization: {
          jwt: authToken,
        },
      });
      return authToken;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }, [getCaInfo, getManagerAddress, getUserInfo, isLogin, isOnChainLogin, walletInfo]);

  return { getETransferAuthToken, getETransferAuthTokenFromApi, getUserInfo };
}
