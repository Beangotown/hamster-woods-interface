'use client';
import { ETransferConfig, WalletTypeEnum } from '@etransfer/ui-react';
import { getContractBasic } from '@portkey/contracts';
import detectProvider from '@portkey/detect-provider';
import {
  ConfigProvider,
  DIDWalletInfo,
  TelegramPlatform,
  did,
  getChainInfo,
  managerApprove,
  socialLoginAuth,
} from '@portkey/did-ui-react';
import { ChainId, IPortkeyProvider } from '@portkey/provider-types';
import { TTokenApproveHandler } from '@portkey/trader-core';
import { aelf } from '@portkey/utils';
import { NetworkType } from 'constants/index';
import { LOGIN_EARGLY_KEY } from 'constants/platform';
import { GetGameLimitSettings, GetPlayerInformation } from 'contract/bingo';
import ContractRequest from 'contract/contractRequest';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  selectInfo,
  setGameSetting,
  setIsNeedSyncAccountInfo,
  setLoginStatus,
  setPlayerInfo,
  setWalletInfo,
  setWalletType,
} from 'redux/reducer/info';
import useGetState from 'redux/state/useGetState';
import { store, useSelector } from 'redux/store';
import { LoginStatus } from 'redux/types/reducerTypes';
import { AccountsType, IDiscoverInfo, PortkeyInfoType, SocialLoginType, WalletInfoType, WalletType } from 'types';
import { sleep } from 'utils/common';
import discoverUtils from 'utils/discoverUtils';
import getAccountInfoSync from 'utils/getAccountInfoSync';
import isPortkeyApp from 'utils/inPortkeyApp';
import { default as DetectProvider, default as InstanceProvider } from 'utils/InstanceProvider';
import { isMobileDevices } from 'utils/isMobile';
import openPageInDiscover from 'utils/openDiscoverPage';
import showMessage from 'utils/setGlobalComponentsInfo';
import { StorageUtils } from 'utils/storage.utils';
import { getSyncHolder, trackLoginInfo } from 'utils/trackAddressInfo';
import { isLoginOnChain } from 'utils/wallet';

export type DiscoverDetectState = 'unknown' | 'detected' | 'not-detected';

export type SignatureParams = {
  appName: string;
  address: string;
  signInfo: string;
  hexToBeSign?: string;
};

export default function useWebLogin({ signHandle }: { signHandle?: any }) {
  const [isLogin, setIsLogin] = useState(false);
  const [isOnChainLogin, setIsOnChainLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginStatus } = useSelector(selectInfo);
  const [wallet, setWallet] = useState<WalletInfoType | null>(null);
  const [_curWalletType, setCurWalletType] = useState<WalletType>(WalletType.unknown);

  const [discoverProvider, setDiscoverProvider] = useState<IPortkeyProvider>();
  const [discoverDetected, setDiscoverDetected] = useState<DiscoverDetectState>('unknown');

  const [discoverInfo, setDiscoverInfo] = useState<IDiscoverInfo>();

  const [didWalletInfo, setDidWalletInfo] = useState<PortkeyInfoType>();

  const syncAddress = useRef<boolean>(false);
  const { walletType, walletInfo } = useGetState();

  const { configInfo } = store.getState();

  const router = useRouter();

  const Network = configInfo.configInfo!.network;

  const curChain = configInfo.configInfo!.curChain as ChainId;

  const portKeyExtensionUrl = configInfo.configInfo!.portKeyExtensionUrl;

  const syncAccountInfo = useCallback(async () => {
    if (walletType === WalletType.unknown) {
      return;
    }

    if (walletType === WalletType.portkey && walletInfo) {
      store.dispatch(setIsNeedSyncAccountInfo(false));
      return;
    }

    if (walletType === WalletType.discover) {
      store.dispatch(setIsNeedSyncAccountInfo(false));
      return;
    }

    const originChainId = StorageUtils.getOriginChainId();
    const wallet = await InstanceProvider.getWalletInstance();
    if (!wallet?.discoverInfo && !wallet?.portkeyInfo) {
      return;
    }

    do {
      try {
        if (!originChainId) return;
        if (originChainId === curChain) {
          syncAddress.current = true;
        } else {
          // showMessage.loading('Syncing on-chain account info');
          let accountSyncInfo;
          store.dispatch(
            setWalletInfo({
              portkeyInfo: {
                caInfo: {
                  caAddress: wallet?.portkeyInfo?.caInfo?.caAddress,
                  caHash: wallet?.portkeyInfo?.caInfo?.caHash,
                },
                pin: wallet?.portkeyInfo?.pin,
                chainId: curChain,
                walletInfo: wallet?.portkeyInfo?.walletInfo,
                accountInfo: wallet?.portkeyInfo?.accountInfo,
              },
            }),
          );
          try {
            accountSyncInfo = (await getAccountInfoSync(curChain, wallet?.portkeyInfo)) ?? {};
          } catch (err) {
            console.error('portkey sync err', err);
          }
          const { holder, filteredHolders } = accountSyncInfo!;
          if (holder && filteredHolders && filteredHolders.length) {
            syncAddress.current = true;
          } else {
            // previously set at 5000ms, which may take too long to re-sync
            // so trying with variable 1000-1500ms to avoid fixed intervals
            await sleep(Math.random() * 1000 + 500);
          }
        }
      } catch (err) {
        console.error('sync error', err);
      }
    } while (!syncAddress.current);
    store.dispatch(setIsNeedSyncAccountInfo(false));
  }, [curChain, walletInfo, walletType]);

  const detect = useCallback(async (): Promise<IPortkeyProvider> => {
    if (discoverProvider?.isConnected()) {
      return discoverProvider!;
    }
    let detectProviderFunc = detectProvider;
    if (typeof detectProvider !== 'function') {
      const detectProviderModule = detectProvider as any;
      detectProviderFunc = detectProviderModule.default;
    }
    let provider: IPortkeyProvider | null;
    try {
      provider = await detectProviderFunc();
    } catch (error) {
      setDiscoverDetected('not-detected');
      throw error;
    }
    if (provider) {
      if (!provider.isPortkey) {
        setDiscoverDetected('not-detected');
        throw new Error('Discover provider found, but check isPortkey failed');
      }
      setDiscoverProvider(provider);
      setDiscoverDetected('detected');
      return provider;
    } else {
      setDiscoverDetected('not-detected');
      throw new Error('Discover provider not found');
    }
  }, [discoverProvider]);

  const logout = useCallback(() => {
    ETransferConfig.setConfig({
      accountInfo: {
        accounts: {},
        walletType: WalletTypeEnum.unknown,
      },
    });
    store.dispatch(setWalletInfo(null));
    console.log('wfs setLoginStatus=>6');
    store.dispatch(setLoginStatus(LoginStatus.UNLOGIN));
    store.dispatch(setWalletType(WalletType.unknown));
    store.dispatch(setPlayerInfo(null));
    discoverUtils.removeDiscoverStorageSign();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (walletType === WalletType.discover && discoverProvider) {
      discoverProvider.on('disconnected', () => {
        logout();
      });
    }
  }, [discoverProvider, logout, walletType]);

  useEffect(() => {
    setIsLogin(loginStatus === LoginStatus.LOGGED);
    setIsOnChainLogin(loginStatus === LoginStatus.ON_CHAIN_LOGGED);
  }, [loginStatus]);

  const handlePortKey = useCallback(async () => {
    if (isMobileDevices() && !isPortkeyApp()) {
      openPageInDiscover();
      return;
    }
    if (!window?.Portkey && !isMobileDevices()) {
      window?.open(portKeyExtensionUrl, '_blank')?.focus();
      return;
    }

    const provider = await detect();
    if (!provider) {
      showMessage.error('Please update your extension to the latest version.');
      return;
    }
    const network = await provider?.request({ method: 'network' });
    console.log(network);
    if (network !== Network) {
      console.log(configInfo);
      if (Network === NetworkType.MAIN) {
        showMessage.error('Please switch to aelf Mainnet.');
      } else {
        showMessage.error('Please switch to aelf Testnet.');
      }

      return;
    }
    let accounts: any = await provider?.request({ method: 'accounts' });
    if (accounts[curChain] && accounts[curChain].length > 0) {
      onAccountsSuccess(provider, accounts);
      return;
    }
    accounts = await provider?.request({ method: 'requestAccounts' });
    if (accounts[curChain] && accounts[curChain].length > 0) {
      onAccountsSuccess(provider, accounts);
    } else {
      showMessage.error('Syncing on-chain account info');
    }
  }, []);

  const handleThirdPart = async (type: SocialLoginType) => {
    discoverUtils.removeDiscoverStorageSign();
    setLoading(true);
    const res = await getSocialToken({ type });
    console.log('wfs onSocialFinish invoke start', new Date());
    await signHandle.onSocialFinish({
      type: res?.provider,
      data:
        type === SocialLoginType.TELEGRAM
          ? { accessToken: res?.token }
          : { accessToken: res?.token, idToken: res?.idToken, nonce: res?.nonce, timestamp: res?.timestamp },
    });
    console.log('wfs onSocialFinish invoke end', new Date());
  };

  const handleGoogle = async () => {
    // TODO
    // TelegramPlatform.isTelegramPlatform() &&
    // ConfigProvider.setGlobalConfig({
    //   globalLoadingHandler: {
    //     onSetLoading: (loadingInfo) => {
    //       console.log(loadingInfo, 'loadingInfo===');
    //     },
    //   },
    // });
    handleThirdPart(SocialLoginType.GOOGLE);
  };

  const handleTeleGram = useCallback(() => {
    console.log('wfs clicked login button', new Date());
    // TODO
    TelegramPlatform.isTelegramPlatform() &&
      ConfigProvider.setGlobalConfig({
        globalLoadingHandler: {
          onSetLoading: (loadingInfo) => {
            console.log(loadingInfo, 'loadingInfo===');
          },
        },
      });
    handleThirdPart(SocialLoginType.TELEGRAM);
  }, []);

  const handleApple = () => {
    handleThirdPart(SocialLoginType.APPLE);
  };

  const getSocialToken = async ({ type }: { type: SocialLoginType; clientId?: string; redirectURI?: string }) => {
    console.log('wfs socialLoginAuth invoke start', new Date());
    const tokenRes = await socialLoginAuth({
      type,
      network: Network as NetworkType,
    });
    console.log('wfs socialLoginAuth invoke end', new Date());
    return tokenRes;
  };

  const updatePlayerInformation = useCallback(async (address: string) => {
    try {
      const information = await GetPlayerInformation(address);
      console.log('=====GetPlayerInformation res', information);
      store.dispatch(setPlayerInfo(information));
    } catch (error) {
      console.error('=====GetPlayerInformation error', error);
    }
  }, []);

  const initializeContract = useCallback(async () => {
    if (!walletInfo) {
      return false;
    }
    const contract = ContractRequest.get();
    const config = {
      chainId: curChain,
      rpcUrl: configInfo.configInfo?.rpcUrl,
      discoverRpcUrl: configInfo.configInfo?.discoverRpcUrl,
      contractAddress: configInfo!.configInfo!.beanGoTownContractAddress,
    };
    contract.setWallet(walletInfo, walletType);
    contract.setConfig(config);

    let address = '';

    console.log(walletType);

    if (walletType === WalletType.discover) {
      address = walletInfo?.discoverInfo?.address || '';
    } else if (walletType === WalletType.portkey) {
      address = walletInfo?.portkeyInfo?.caInfo?.caAddress || '';
    } else {
      return false;
    }

    address && updatePlayerInformation(address);

    try {
      const gameSetting = await GetGameLimitSettings();
      store.dispatch(setGameSetting(gameSetting));
      console.log('gameSetting', gameSetting);
    } catch (err) {
      console.error('GetGameLimitSettingsErr:', err);
      return false;
    }
    return true;
  }, [configInfo, curChain, updatePlayerInformation, walletInfo, walletType]);

  const onAccountsSuccess = useCallback(async (provider: IPortkeyProvider, accounts: AccountsType) => {
    let nickName = 'Wallet 01';
    const address = accounts[curChain]?.[0].split('_')[1];
    console.log('address', address);

    try {
      nickName = await provider.request({ method: 'wallet_getWalletName' });
    } catch (error) {
      console.warn(error);
    }
    const discoverInfo = {
      address,
      accounts,
      nickName,
    };

    handleFinish(WalletType.discover, discoverInfo);
  }, []);

  const handleFinish = useCallback(
    async (type: WalletType, walletInfo: PortkeyInfoType | IDiscoverInfo) => {
      console.log('wallet', type, walletInfo);

      if (type === WalletType.discover) {
        store.dispatch(setWalletType(type));
        localStorage.setItem(LOGIN_EARGLY_KEY, 'true');
        setDiscoverInfo(walletInfo);
        setWallet({ discoverInfo: walletInfo as IDiscoverInfo });
        setCurWalletType(type);
        store.dispatch(
          setWalletInfo({
            discoverInfo: walletInfo,
          }),
        );
        InstanceProvider.setWalletInfoInstance({
          discoverInfo: walletInfo,
        });
        trackLoginInfo({
          caAddress: (walletInfo as IDiscoverInfo).address!,
          caHash: '',
        });
        console.log('wfs setLoginStatus=>7');
        store.dispatch(setLoginStatus(LoginStatus.LOGGED));
      } else if (type === WalletType.portkey) {
        const keyName = StorageUtils.getWalletKey();

        store.dispatch(
          setWalletInfo({
            portkeyInfo: walletInfo,
          }),
        );
        did.save((walletInfo as PortkeyInfoType)?.pin || '', keyName);
        setDidWalletInfo(walletInfo as PortkeyInfoType);
        setWallet({
          portkeyInfo: walletInfo as PortkeyInfoType,
        });
        setCurWalletType(type);
        store.dispatch(setWalletType(WalletType.portkey));
        if ((walletInfo as PortkeyInfoType).chainId !== curChain) {
          InstanceProvider.setWalletInfoInstance({
            portkeyInfo: walletInfo as PortkeyInfoType,
          });
          const holder = await getSyncHolder(curChain, walletInfo as DIDWalletInfo);
          trackLoginInfo({ caAddress: holder.caAddress, caHash: (walletInfo as PortkeyInfoType)!.caInfo!.caHash });
        } else {
          store.dispatch(
            setWalletInfo({
              portkeyInfo: walletInfo,
            }),
          );
          trackLoginInfo({
            caAddress: (walletInfo as PortkeyInfoType)!.caInfo!.caAddress,
            caHash: (walletInfo as PortkeyInfoType)!.caInfo!.caHash,
          });
        }
        console.log('wfs handleFinish isLogin', isLogin, 'isOnChainLogin', isOnChainLogin);
        if (isLoginOnChain()) {
          console.log('wfs setLoginStatus=>8');
          store.dispatch(setLoginStatus(LoginStatus.ON_CHAIN_LOGGED));
        } else {
          console.log('wfs setLoginStatus=>9');
          store.dispatch(setLoginStatus(LoginStatus.LOGGED));
        }
      }
    },
    [curChain, isLogin, isOnChainLogin],
  );

  const handleOnChainFinish = useCallback(
    async (type: WalletType, walletInfo: PortkeyInfoType | IDiscoverInfo) => {
      console.log('wallet handleOnChainFinish', type, walletInfo);
      ConfigProvider.setGlobalConfig({
        globalLoadingHandler: undefined,
      });
      if (type === WalletType.discover) {
        store.dispatch(setWalletType(type));
        localStorage.setItem(LOGIN_EARGLY_KEY, 'true');
        setDiscoverInfo(walletInfo);
        setWallet({ discoverInfo: walletInfo as IDiscoverInfo });
        setCurWalletType(type);
        store.dispatch(
          setWalletInfo({
            discoverInfo: walletInfo,
          }),
        );
        InstanceProvider.setWalletInfoInstance({
          discoverInfo: walletInfo,
        });
        trackLoginInfo({
          caAddress: (walletInfo as IDiscoverInfo).address!,
          caHash: '',
        });
        console.log('wfs setLoginStatus=>10');
        store.dispatch(setLoginStatus(LoginStatus.LOGGED));
      } else if (type === WalletType.portkey) {
        const keyName = StorageUtils.getWalletKey();

        await did.save((walletInfo as PortkeyInfoType)?.pin || '', keyName);
        console.log('wfs exe did save success!!');
        setDidWalletInfo(walletInfo as PortkeyInfoType);
        setWallet({
          portkeyInfo: walletInfo as PortkeyInfoType,
        });
        setCurWalletType(type);
        store.dispatch(setWalletType(WalletType.portkey));
        store.dispatch(
          setWalletInfo({
            portkeyInfo: walletInfo,
          }),
        );
        if ((walletInfo as PortkeyInfoType).chainId !== curChain) {
          InstanceProvider.setWalletInfoInstance({
            portkeyInfo: walletInfo as PortkeyInfoType,
          });
          const holder = await getSyncHolder(curChain, walletInfo as DIDWalletInfo);
          trackLoginInfo({ caAddress: holder.caAddress, caHash: (walletInfo as PortkeyInfoType)!.caInfo!.caHash });
        } else {
          store.dispatch(
            setWalletInfo({
              portkeyInfo: walletInfo,
            }),
          );
          trackLoginInfo({
            caAddress: (walletInfo as PortkeyInfoType)!.caInfo!.caAddress,
            caHash: (walletInfo as PortkeyInfoType)!.caInfo!.caHash,
          });
        }
        console.log('wfs handleOnChainFinish isLogin', isLogin, 'isOnChainLogin', isOnChainLogin);
        console.log('wfs setLoginStatus=>11');
        store.dispatch(setLoginStatus(LoginStatus.ON_CHAIN_LOGGED));
      }
    },
    [curChain],
  );

  const loginEagerly = useCallback(async () => {
    const provider = await detect();
    const isConnected = provider.isConnected();
    if (!isConnected) return;
    setLoading(true);
    try {
      const network = await provider.request({ method: 'network' });
      if (network !== Network) {
        console.log('ERR_CODE.NETWORK_TYPE_NOT_MATCH');
        setLoading(false);
        return;
      }
      const accounts = await provider.request({ method: 'accounts' });
      console.log(accounts);
      if (accounts[curChain] && accounts[curChain]!.length > 0) {
        onAccountsSuccess(provider, accounts);
        setLoading(false);
      } else {
        console.log('ERR_CODE.DISCOVER_LOGIN_EAGERLY_FAIL');
        setLoading(false);
      }
    } catch (error: any) {
      console.log({
        code: 10001,
        message: error?.message || 'unknown error',
        nativeError: error,
      });
      setLoading(false);
    }
  }, [Network, curChain, onAccountsSuccess]);

  const getDiscoverSignature = useCallback(
    async (params: SignatureParams) => {
      // checkSignatureParams(params);
      const discoverInfo = walletInfo?.discoverInfo;
      if (!discoverInfo) {
        throw new Error('Discover not connected');
      }
      const discoverProvider = await DetectProvider.getDetectProvider();
      const provider = discoverProvider! as IPortkeyProvider;
      const signInfo = params.signInfo;
      const signedMsgObject = await provider.request({
        method: 'wallet_getSignature',
        payload: {
          data: signInfo || params.hexToBeSign,
        },
      });
      const signedMsgString = [
        signedMsgObject.r.toString(16, 64),
        signedMsgObject.s.toString(16, 64),
        `0${signedMsgObject.recoveryParam!.toString()}`,
      ].join('');
      return {
        error: 0,
        errorMessage: '',
        signature: signedMsgString,
        from: 'discover',
      };
    },
    [discoverInfo, discoverProvider],
  );

  const getPortKeySignature = useCallback(
    async (params: SignatureParams) => {
      // checkSignatureParams(params);
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
    [didWalletInfo],
  );

  const getOptions: any = useCallback(async () => {
    if (WalletType.unknown === walletType) throw 'unknown';

    if (WalletType.portkey === walletType) {
      const keyName = StorageUtils.getWalletKey();

      const wallet = await did.load(walletInfo?.portkeyInfo?.pin || '', keyName);
      if (!wallet.didWallet.managementAccount) throw 'no managementAccount';
      const caHash = wallet.didWallet.aaInfo.accountInfo?.caHash || '';
      const chainInfo = await getChainInfo(curChain);
      return {
        contractOptions: {
          account: aelf.getWallet(wallet.didWallet.managementAccount.privateKey),
          callType: 'ca' as any,
          caHash,
          caContractAddress: chainInfo.caContractAddress,
        },
        address: wallet.didWallet.aaInfo.accountInfo?.caAddress || '',
      };
    } else {
      let provider;
      if (discoverProvider?.isConnected()) {
        provider = discoverProvider!;
      } else {
        provider = await detectProvider();
      }
      if (!provider) return;
      // get chain provider
      const chainProvider = await provider.getChain(curChain);
      const accountsResult = await provider.request({ method: 'requestAccounts' });
      const caAddress = accountsResult[curChain]?.[0];
      console.log('===chainProvider, caAddress', chainProvider, caAddress);
      return { contractOptions: { chainProvider }, address: caAddress };
    }
  }, [curChain, discoverProvider, walletInfo?.portkeyInfo?.pin, walletType]);

  const tokenApprove: TTokenApproveHandler = useCallback(
    async (params) => {
      const originChainId = (StorageUtils.getOriginChainId() || curChain) as ChainId;

      const caHash = did.didWallet.aaInfo.accountInfo?.caHash || '';
      const chainInfo = await getChainInfo(curChain);
      const [portkeyContract] = await Promise.all(
        [chainInfo.caContractAddress, chainInfo.defaultToken.address].map((ca) =>
          getContractBasic({
            contractAddress: ca,
            account: aelf.getWallet(did.didWallet.managementAccount?.privateKey || ''),
            rpcUrl: chainInfo.endPoint,
          }),
        ),
      );

      const result = await managerApprove({
        originChainId: originChainId,
        symbol: params.symbol,
        caHash,
        amount: params.amount,
        spender: params.spender,
        targetChainId: curChain,
        networkType: Network as NetworkType,
        dappInfo: {
          name: 'Hamster',
        },
      });
      console.log(result, 'result===');

      const approveResult = await portkeyContract.callSendMethod('ManagerApprove', '', {
        caHash,
        spender: params.spender,
        symbol: result.symbol,
        amount: result.amount,
        guardiansApproved: result.guardiansApproved,
      });
      if (approveResult.error) throw approveResult.error;
    },
    [Network, curChain],
  );

  return {
    isLogin,
    isOnChainLogin,
    loading,
    discoverDetected,
    wallet,
    walletType,
    loginEagerly,
    handlePortKey,
    handleGoogle,
    handleTeleGram,
    handleApple,
    handleFinish,
    handleOnChainFinish,
    initializeContract,
    getDiscoverSignature,
    getPortKeySignature,
    updatePlayerInformation,
    syncAccountInfo,
    getOptions,
    tokenApprove,
  };
}
