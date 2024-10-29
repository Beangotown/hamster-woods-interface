'use client';
import {
  AddManagerType,
  ConfigProvider,
  CreatePendingInfo,
  did,
  DIDWalletInfo,
  errorTip,
  getOperationDetails,
  GuardianApprovalModal,
  handleErrorMessage,
  IGuardianIdentifierInfo,
  LifeCycleType,
  NetworkType,
  setLoading,
  SignIn,
  TelegramPlatform,
  TOnSuccessExtraData,
  TStep1LifeCycle,
  TStep2SignInLifeCycle,
  TStep2SignUpLifeCycle,
  TStep3LifeCycle,
  Unlock,
  useLoginWallet,
  useMultiVerify,
  UserGuardianStatus,
  useSignHandler,
  useSignInHandler,
} from '@portkey/did-ui-react';
import { AccountType, GuardiansApproved } from '@portkey/services';
import { ChainId } from '@portkey/types';
import { Drawer, Modal } from 'antd';
import {
  AppleIcon,
  CloseIcon,
  EmailIcon,
  GoogleIcon,
  PhoneIcon,
  PortkeyIcon,
  QrCodeIcon,
  TelegramIcon,
} from 'assets/images/index';
import CommonBtn from 'components/CommonBtn';
import ShowPageLoading from 'components/ShowPageLoading';
import { WalletType } from 'constants/index';
import { DEFAULT_PIN } from 'constants/login';
import {
  KEY_NAME,
  LOGIN_EARGLY_KEY,
  PORTKEY_LOGIN_CHAIN_ID_KEY,
  PORTKEY_LOGIN_SESSION_ID_KEY,
} from 'constants/platform';
import ContractRequest from 'contract/contractRequest';
import useVerifier from 'hooks/useVarified';
import useWebLogin from 'hooks/useWebLogin';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setChessboardResetStart, setChessboardTotalStep, setCurChessboardNode } from 'redux/reducer/chessboardData';
import {
  setIsNeedSyncAccountInfo,
  setLoginStatus,
  setPlayerInfo,
  setWalletInfo,
  setWalletType,
} from 'redux/reducer/info';
import useGetState from 'redux/state/useGetState';
import { store } from 'redux/store';
import { LoginStatus } from 'redux/types/reducerTypes';
import { OperationTypeEnum, SignInDesignType, SocialLoginType, TSignUpVerifier } from 'types/index';
import { sleep } from 'utils/common';
import { getProto } from 'utils/deserializeLog';
import discoverUtils from 'utils/discoverUtils';
import { handleSDKLogoutOffChain } from 'utils/handleLogout';
import isPortkeyApp from 'utils/inPortkeyApp';
import isMobile, { isMobileDevices } from 'utils/isMobile';
import { Proto } from 'utils/proto';
import showMessage from 'utils/setGlobalComponentsInfo';
import { StorageUtils } from 'utils/storage.utils';
import { isLoginOnChain } from 'utils/wallet';
import styles from './style.module.css';

const components = {
  phone: PhoneIcon,
  email: EmailIcon,
  apple: AppleIcon,
  portkey: PortkeyIcon,
  qrcode: QrCodeIcon,
  google: GoogleIcon,
  telegram: TelegramIcon,
};

type IconType = 'apple' | 'google' | 'portkey' | 'email' | 'phone' | 'qrcode' | 'telegram';

const Login = () => {
  const signInRef = useRef<{ setOpen: Function }>(null);
  const isGettingTelegramAuthRef = useRef(false);

  const [style, setStyle] = useState<string>(styles.inputForm);

  const [design, setDesign] = useState<SignInDesignType>('Web2Design');

  const [approvalVisible, setApprovalVisible] = useState(false);
  const identifierRef = useRef<string>();

  const { configInfo } = useGetState();
  const { curChain, network } = configInfo!;
  const [originChainId, setOriginChainId] = useState<ChainId>(curChain);
  const [caHash, setCaHash] = useState<string>('');
  const caInfoRef = useRef<{ caAddress: string; caHash: string }>({ caAddress: '', caHash: '' });
  const [guardianList, setGuardianList] = useState<UserGuardianStatus[]>();
  const multiVerify = useMultiVerify();
  const isTelegramPlatform = useMemo(() => {
    // TODO test data
    // return true;
    return TelegramPlatform.isTelegramPlatform();
  }, []);

  const [showPageLoading, setShowPageLoading] = useState(false);

  const [currentLifeCircle, setCurrentLifeCircle] = useState<
    TStep2SignInLifeCycle | TStep1LifeCycle | TStep3LifeCycle | TStep2SignUpLifeCycle
  >({});

  const beforeLastGuardianApprove = () => {
    if (isTelegramPlatform) {
      handleFinish(WalletType.portkey, {
        pin: DEFAULT_PIN,
        chainId: originChainId,
        caInfo: caInfoRef.current,
      });
    }
  };

  const onSignInHandler = useSignInHandler({ isErrorTip: true, beforeLastGuardianApprove });
  const handleSocialStep1Success = async (value: IGuardianIdentifierInfo, extraData?: TOnSuccessExtraData) => {
    console.log('wfs onSuccess invoke start', value, new Date());
    setDrawerVisible(false);
    setModalVisible(false);
    if (extraData) {
      setOriginChainId(extraData.originChainId);
      setCaHash(extraData.caHash);
      caInfoRef.current = {
        caAddress: extraData.caAddress,
        caHash: extraData.caHash,
      };
    }
    if (!did.didWallet.managementAccount) did.create();
    if (!value.isLoginGuardian) {
      await onSignUp(value as IGuardianIdentifierInfo);
    } else {
      console.log('wfs onSignInHandler invoke start', new Date());
      const signResult = await onSignInHandler(value);
      console.log('wfs onSignInHandler invoke end', signResult, new Date());
      if (!signResult) return;
      identifierRef.current = signResult.value.guardianIdentifierInfo?.identifier;
      if (signResult.nextStep === 'SetPinAndAddManager' && isTelegramPlatform) {
        try {
          const guardianIdentifierInfo = signResult.value.guardianIdentifierInfo;
          const approvedList = signResult.value.approvedList;
          if (!approvedList) return;
          const type: AddManagerType = guardianIdentifierInfo?.isLoginGuardian ? 'recovery' : 'register';
          const params = {
            pin: DEFAULT_PIN,
            type,
            chainId: guardianIdentifierInfo.chainId,
            accountType: guardianIdentifierInfo.accountType,
            guardianIdentifier: guardianIdentifierInfo?.identifier,
            guardianApprovedList: approvedList,
          };
          console.log(
            'wfs createWallet invoke start',
            new Date(),
            'did.didWallet.managementAccount',
            did.didWallet.managementAccount,
          );
          const didWallet = await createWallet(params);
          console.log(
            'wfs createWallet invoke end',
            new Date(),
            'did.didWallet.managementAccount',
            did.didWallet.managementAccount,
          );
          didWallet && handleOnChainFinishWrapper(didWallet);
        } catch (e) {
          console.log('wfs wallet is: error', e, new Date());
        }
        // didWallet && handlePortKeyLoginFinish(didWallet);
      } else {
        setLoading(false);
        if (isTelegramPlatform) {
          setGuardianList(signResult.value.guardianList || []);
          setTimeout(() => {
            setApprovalVisible(true);

            ConfigProvider.setGlobalConfig({
              globalLoadingHandler: undefined,
            });
          }, 500);
          return;
        }
        setCurrentLifeCircle({
          [signResult.nextStep as any]: signResult.value,
        });
        setTimeout(() => {
          signInRef.current?.setOpen(true);
        }, 500);
      }
    }
  };
  const signHandle = useSignHandler({
    onSuccess: handleSocialStep1Success,
    defaultChainId: curChain,
    customValidateEmail: undefined,
    customValidatePhone: undefined,
    onChainIdChange: undefined,
    onError: undefined,
  });
  const { handlePortKey, handleFinish, handleOnChainFinish, handleApple, handleGoogle, handleTeleGram, loginEagerly } =
    useWebLogin({
      signHandle,
    });

  const handlePortKeyLoginFinish = useCallback(
    async (wallet: DIDWalletInfo) => {
      console.log('wallet is:', wallet);
      signInRef.current?.setOpen(false);
      StorageUtils.setOriginChainId(wallet.chainId);
      setShowPageLoading(true);
      await handleFinish(WalletType.portkey, wallet);
      setShowPageLoading(false);
      setLoading(false);
    },
    [handleFinish],
  );
  const handleOnChainFinishWrapper = useCallback(
    async (wallet: DIDWalletInfo) => {
      console.log('wfs onFinish invoke start', wallet, new Date());
      if (wallet.createType !== 'recovery') {
        handlePortKeyLoginFinish(wallet);
        return;
      }
      await handleOnChainFinish(WalletType.portkey, wallet);
      console.log('wfs onFinish invoke end', wallet, new Date());
    },
    [handleOnChainFinish, handlePortKeyLoginFinish],
  );
  const handleCreatePending = useCallback(
    async (createPendingInfo: CreatePendingInfo) => {
      console.log('wfs onCreatePending invoke!', createPendingInfo, new Date());
      if (createPendingInfo.createType === 'register') {
        return;
      }
      StorageUtils.setSessionStorage(createPendingInfo.sessionId);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await handlePortKeyLoginFinish(createPendingInfo.didWallet!);
    },
    [handlePortKeyLoginFinish],
  );

  const beforeCreatePending = useCallback(() => {
    if (isTelegramPlatform) {
      ConfigProvider.setGlobalConfig({
        globalLoadingHandler: {
          onSetLoading: (loadingInfo) => {
            console.log(loadingInfo, 'loadingInfo===');
          },
        },
      });
      handleFinish(WalletType.portkey, {
        pin: DEFAULT_PIN,
        chainId: originChainId,
        caInfo: caInfoRef.current,
      });
    }
  }, [handleFinish, isTelegramPlatform, originChainId]);

  const createWallet = useLoginWallet({
    onCreatePending: handleCreatePending,
    onError: handleSDKLogoutOffChain,
  });

  const { isLock, isLogin, isOnChainLogin, isMobile: isMobileStore, walletType } = useGetState();

  const router = useRouter();

  const onTGSignInApprovalSuccess = useCallback(
    async (guardian: any) => {
      ConfigProvider.setGlobalConfig({
        globalLoadingHandler: {
          onSetLoading: (loadingInfo) => {
            console.log(loadingInfo, 'loadingInfo===');
          },
        },
      });
      setApprovalVisible(false);
      handleFinish(WalletType.portkey, {
        pin: DEFAULT_PIN,
        chainId: originChainId,
        caInfo: caInfoRef.current,
      });
      const res = await multiVerify(guardian);
      const params = {
        pin: DEFAULT_PIN,
        type: 'recovery' as AddManagerType,
        chainId: originChainId,
        accountType: 'Telegram' as AccountType,
        guardianIdentifier: identifierRef.current || '',
        guardianApprovedList: res as GuardiansApproved[],
      };
      const didWallet = await createWallet(params);

      didWallet && handleOnChainFinishWrapper(didWallet);
    },
    [createWallet, handleFinish, handleOnChainFinishWrapper, multiVerify, originChainId],
  );
  useEffect(() => {
    console.log('wfs Login useEffect1 isLogin', isLogin, 'isOnChainLogin', isOnChainLogin);
    if (isLogin || isOnChainLogin) {
      console.log('wfs Login useEffect2 isLogin', isLogin, 'isOnChainLogin', isOnChainLogin);
      router.replace('/');
    }
  }, [isLogin, isOnChainLogin, router]);

  const isInIOS = isMobile().apple.device;

  const isInApp = isPortkeyApp();

  // const [_isWalletExist, setIsWalletExist] = useState(false);

  useEffect(() => {
    if (typeof window !== undefined) {
      if (window.localStorage.getItem(LOGIN_EARGLY_KEY)) {
        loginEagerly();
      }
    }
  }, [loginEagerly]);

  useEffect(() => {
    console.log('wfs setLoginStatus=>4 isLock', isLock);
    if (isLock || isGettingTelegramAuthRef.current) {
      return;
    }
    if (typeof window !== undefined) {
      // if (window.localStorage.getItem(LOGIN_EARGLY_KEY)) {
      //   loginEagerly();
      //   return;
      // }
      if (window.localStorage.getItem(StorageUtils.getWalletKey())) {
        console.log('wfs setLoginStatus=>4');
        setLoginStatus(LoginStatus.LOCK);
        // setIsWalletExist(true);
      } else if (isTelegramPlatform) {
        // Automatically obtain Telegram authorization
        isGettingTelegramAuthRef.current = true;
        handleTeleGram();
      } else if (isPortkeyApp()) {
        handlePortKey();
      }
    }
  }, [isLock, handleTeleGram, handlePortKey, isTelegramPlatform]);

  const handleEmail = () => {
    discoverUtils.removeDiscoverStorageSign();
    closeModal();
    setStyle(styles.inputForm);
    setDesign('Web2Design');
    setCurrentLifeCircle({});
    setTimeout(() => {
      signInRef.current?.setOpen(true);
    }, 500);
    setTimeout(() => {
      (document.getElementsByClassName('portkey-ant-segmented-item')?.[1] as HTMLElement)?.click();
    }, 1000);
  };

  const closeModal = () => {
    setDrawerVisible(false);
    setModalVisible(false);
  };

  const handleQrcode = () => {
    discoverUtils.removeDiscoverStorageSign();
    closeModal();
    setStyle(styles.qrcodeBox);
    setDesign('SocialDesign');
    setCurrentLifeCircle({ LoginByScan: undefined });
    setTimeout(() => {
      signInRef.current?.setOpen(true);
    }, 500);
  };

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [isUnlockShow, setIsUnlockShow] = useState(false);

  const [passwordValue, setPasswordValue] = useState('');

  const [isErrorTipShow, setIsErrorTipShow] = useState(false);

  const renderLoginMethods = (inModel: boolean) => {
    const allMethods = [
      { name: 'Login with Portkey', onclick: handlePortKey, iconName: 'portkey' },
      {
        name: 'Login with Telegram',
        onclick: handleTeleGram,
        iconName: 'telegram',
        yellowColor: !inModel ? true : undefined,
      },
      {
        name: 'Login with Google',
        onclick: handleGoogle,
        iconName: 'google',
        yellowColor: !inModel ? true : undefined,
      },
      { name: 'Login with Apple', onclick: handleApple, yellowColor: !inModel ? true : undefined, iconName: 'apple' },
      { name: 'Login with Email', onclick: handleEmail, iconName: 'email' },
      { name: 'Login with QR code', onclick: handleQrcode, iconName: 'qrcode' },
    ];
    let filterMethods = allMethods;
    if (isInApp) {
      filterMethods = [allMethods[0]];
    } else if (isInIOS) {
      filterMethods = inModel
        ? [allMethods[1], ...allMethods.slice(3, allMethods.length)]
        : [allMethods[0], allMethods[2]];
    } else {
      filterMethods = inModel
        ? [allMethods[2], ...allMethods.slice(3, allMethods.length)]
        : [allMethods[0], allMethods[1]];
    }
    return filterMethods.map((item, index) => (
      <div
        key={index}
        onClick={item.onclick}
        className={`${item?.yellowColor ? styles.loginBtnYellow : styles.loginBtn} ${
          isMobileStore ? '' : 'mx-[96px]'
        } `}>
        {getIconComponent(item.iconName as IconType, inModel)}
        <span className="flex-1 text-center font-paytone">{item.name}</span>
      </div>
    ));
  };

  const renderMoreContent = () => {
    return (
      <>
        <div className={styles.drawerHeader}>
          Login method
          {
            <CloseIcon
              className={styles.drawer__close}
              onClick={() => {
                closeModal();
              }}
            />
          }
        </div>
        {renderLoginMethods(true)}
      </>
    );
  };

  const getIconComponent = (name: IconType, inModel: boolean) => {
    const Con = components[name] || null;
    return <Con className={inModel ? styles.loginBtnBlueIcon : styles.loginBtnIcon} />;
  };

  const unlock = useCallback(
    async (v: string) => {
      let wallet;
      try {
        const keyName = StorageUtils.getWalletKey();

        wallet = await did.load(v, keyName);

        if (!wallet?.didWallet.managementAccount) {
          const preWallet = await did.load(v, KEY_NAME);
          if (preWallet?.didWallet?.managementAccount) {
            wallet = preWallet;
            localStorage.setItem(keyName, localStorage.getItem(KEY_NAME) || '');
            localStorage.removeItem(KEY_NAME);
            const sessionId = localStorage.getItem(PORTKEY_LOGIN_SESSION_ID_KEY);
            sessionId && StorageUtils.setSessionStorage(sessionId);
            localStorage.removeItem(PORTKEY_LOGIN_SESSION_ID_KEY);
            localStorage.removeItem(PORTKEY_LOGIN_CHAIN_ID_KEY);
          } else {
            isTelegramPlatform && (StorageUtils.removeWallet(), window.location.reload());
          }
        }
        wallet.didWallet.originChainId && StorageUtils.setOriginChainId(wallet.didWallet.originChainId);

        console.log('wallet is:', wallet.didWallet, !wallet.didWallet.aaInfo);
      } catch (err) {
        console.log(err);
        return;
      }
      if (!wallet?.didWallet?.aaInfo?.accountInfo?.caAddress && !wallet?.didWallet?.accountInfo.loginAccount) {
        setIsErrorTipShow(true);
        setPasswordValue('');
        return;
      }

      const caInfo = wallet.didWallet.caInfo[configInfo!.curChain];
      const originChainId = StorageUtils.getOriginChainId();
      if (!originChainId) return;
      let caHash = caInfo?.caHash;

      setShowPageLoading(true);
      if (!caInfo) {
        console.log('if');
        try {
          console.log('originChainId', originChainId);
          caHash = wallet.didWallet.caInfo[originChainId].caHash;
          const caAddress = wallet.didWallet.caInfo[originChainId].caAddress;
          setIsUnlockShow(false);
          await handleFinish(WalletType.portkey, {
            caInfo: { caHash, caAddress },
            walletInfo: wallet.didWallet.managementAccount,
            pin: v,
            chainId: originChainId as ChainId,
          });
        } catch (err) {
          showMessage.error();
          console.log('wallet is: unlock error', err);
          setShowPageLoading(false);
          return;
        }
      } else {
        console.log('else');
        setIsUnlockShow(false);
        const walletInfo = {
          caInfo,
          pin: v,
          chainId: configInfo!.curChain,
          walletInfo: wallet.didWallet.managementAccount,
        };
        await handleFinish(WalletType.portkey, walletInfo);
        setShowPageLoading(false);
      }
      const sessionId = StorageUtils.getSessionStorage();
      if (!isLoginOnChain()) {
        if (sessionId && originChainId) {
          const { recoveryStatus } = await did.didWallet.getLoginStatus({
            sessionId,
            chainId: originChainId as ChainId,
          });
          if (recoveryStatus === 'pass') {
            console.log('wfs setLoginStatus=>5');
            store.dispatch(setLoginStatus(LoginStatus.ON_CHAIN_LOGGED));
            const keyName = StorageUtils.getWalletKey();

            await did.save(v || '', keyName);
          }
        } else {
          if (wallet.didWallet.managementAccount?.address) {
            const result = await did.didWallet.checkManagerIsExistByGQL({
              chainId: originChainId as ChainId,
              caHash,
              managementAddress: wallet.didWallet.managementAccount?.address,
            });
            if (result) {
              store.dispatch(setLoginStatus(LoginStatus.ON_CHAIN_LOGGED));
              const keyName = StorageUtils.getWalletKey();

              await did.save(v || '', keyName);
            }
          }
        }
      }
    },
    [configInfo, handleFinish, isTelegramPlatform],
  );

  useEffect(() => {
    if (isTelegramPlatform && isLock) {
      unlock(DEFAULT_PIN);
    }
  }, [isLock, isTelegramPlatform, unlock]);

  const { getRecommendationVerifier, verifySocialToken } = useVerifier();

  const onStep2OfSignUpFinish = useCallback(
    async (res: TSignUpVerifier, value?: IGuardianIdentifierInfo) => {
      const identifier = value;
      if (!identifier) return console.error('No guardianIdentifier!');
      const list = [
        {
          type: identifier?.accountType,
          identifier: identifier?.identifier,
          verifierId: res.verifier.id,
          verificationDoc: res.verificationDoc,
          signature: res.signature,
          zkLoginInfo: res.zkLoginInfo,
        },
      ];
      if (isTelegramPlatform) {
        const params = {
          pin: DEFAULT_PIN,
          type: 'register' as AddManagerType,
          chainId: curChain,
          accountType: identifier?.accountType,
          guardianIdentifier: identifier?.identifier,
          guardianApprovedList: list,
        };
        const createResult = await createWallet(params);
        createResult && handlePortKeyLoginFinish(createResult);
      } else {
        setCurrentLifeCircle({
          SetPinAndAddManager: {
            guardianIdentifierInfo: identifier,
            approvedList: list,
          },
        });
        setTimeout(() => {
          signInRef.current?.setOpen(true);
        }, 500);
      }
    },
    [createWallet, curChain, handlePortKeyLoginFinish, isTelegramPlatform],
  );

  const onSignUp = useCallback(
    async (value: IGuardianIdentifierInfo) => {
      try {
        setLoading(true, 'Assigning a verifier on-chain…');
        await sleep(2000);
        const verifier = await getRecommendationVerifier(curChain);
        setLoading(false);
        const { accountType, authenticationInfo, identifier } = value;
        if (
          accountType === SocialLoginType.APPLE ||
          accountType === SocialLoginType.GOOGLE ||
          accountType === SocialLoginType.TELEGRAM
        ) {
          setLoading(true);
          console.log('authenticationInfo', authenticationInfo);
          const operationDetails = JSON.stringify({ manager: did.didWallet.managementAccount?.address });

          const result = await verifySocialToken({
            accountType,
            token: authenticationInfo?.authToken,
            idToken: authenticationInfo?.idToken,
            nonce: authenticationInfo?.nonce,
            timestamp: authenticationInfo?.timestamp,
            guardianIdentifier: identifier,
            verifier,
            chainId: curChain,
            operationType: OperationTypeEnum.register,
            operationDetails,
          });
          setLoading(false);
          console.log(result);
          if (!result?.zkLoginInfo && (!result?.signature || !result?.verificationDoc)) {
            throw 'Verify social login error';
          }
          onStep2OfSignUpFinish(
            {
              verifier,
              verificationDoc: result?.verificationDoc,
              signature: result?.signature,
              zkLoginInfo: result?.zkLoginInfo,
            },
            value,
          );
        }
      } catch (error) {
        setLoading(false);
        const errorMsg = handleErrorMessage(error);
        errorTip(
          {
            errorFields: 'Check sign up',
            error: errorMsg,
          },
          true,
          () => {
            console.log('error');
          },
        );
      }
    },
    [curChain, getRecommendationVerifier, onStep2OfSignUpFinish, verifySocialToken],
  );

  const setModalOpen = () => {
    if (isMobileDevices()) {
      setDrawerVisible(true);
    } else {
      setModalVisible(true);
    }
  };

  useEffect(() => {
    const initializeProto = async () => {
      if (configInfo?.rpcUrl && configInfo?.beanGoTownContractAddress) {
        const protoBuf = await getProto(configInfo.beanGoTownContractAddress, configInfo.rpcUrl);
        const proto = Proto.getInstance();
        proto.setProto(protoBuf);
      }
    };
    initializeProto();
  }, [configInfo?.rpcUrl, configInfo?.beanGoTownContractAddress]);

  const onForgetPin = useCallback(() => {
    showMessage.loading('Signing out of Hamster Woods');
    if (walletType === WalletType.portkey) {
      StorageUtils.removeWallet();
      did.reset();
    } else if (walletType === WalletType.discover) {
      window.localStorage.removeItem(LOGIN_EARGLY_KEY);
    }

    store.dispatch(setLoginStatus(LoginStatus.UNLOGIN));
    store.dispatch(setWalletInfo(null));
    store.dispatch(setWalletType(WalletType.unknown));
    store.dispatch(setPlayerInfo(null));
    store.dispatch(setCurChessboardNode(null));
    store.dispatch(setChessboardResetStart(true));
    store.dispatch(setChessboardTotalStep(0));
    store.dispatch(setIsNeedSyncAccountInfo(true));
    StorageUtils.removeWallet();
    StorageUtils.removeOriginChainId();
    StorageUtils.removeSessionStorage();
    ContractRequest.get().resetConfig();
    setIsUnlockShow(false);
    showMessage.hideLoading();
    if (isTelegramPlatform) {
      TelegramPlatform.close();
    }
  }, [isTelegramPlatform, walletType]);

  const forgetPinElement = useMemo(() => {
    return (
      <span className={styles.unlock_footer_text}>
        Forgot your PIN? Click{' '}
        <a className={styles.unlock_footer_highlight} onClick={onForgetPin}>
          here
        </a>{' '}
        to log back in.
      </span>
    );
  }, [onForgetPin]);

  const onLifeCycleChange = useCallback(
    (liftCycle: LifeCycleType) => {
      console.log(liftCycle, 'liftCycle===');
      if (!isTelegramPlatform) return;
      if (liftCycle === 'GuardianApproval' || liftCycle === 'Step2OfSkipGuardianApprove') {
        ConfigProvider.setGlobalConfig({
          globalLoadingHandler: undefined,
        });
        return;
      }
      // if (liftCycle === 'SetPinAndAddManager') {
      //   ConfigProvider.setGlobalConfig({
      //     globalLoadingHandler: {
      //       onSetLoading: (loadingInfo) => {
      //         console.log(loadingInfo, 'loadingInfo===SetPinAndAddManager');
      //       },
      //     },
      //   });
      //   return;
      // }
    },
    [isTelegramPlatform],
  );

  return (
    <div
      className={`cursor-custom ${
        isTelegramPlatform ? '' : `${styles.loginContainer} ${isMobileStore ? '' : '!pt-[14.8vh]'} `
      } `}
      style={{
        backgroundImage: isTelegramPlatform
          ? ''
          : `url(${
              require(isMobileStore ? 'assets/images/bg/game-bg-mobile-mask.png' : 'assets/images/bg/game-bg-pc.png')
                .default.src
            })`,
      }}>
      {!isMobileStore && !isTelegramPlatform ? (
        <img
          className="z-10 w-[400px] h-[400px]"
          width={400}
          height={400}
          src={require('assets/images/bg/hamster-logo.png').default.src}
          alt="logo"
        />
      ) : null}

      {!isTelegramPlatform &&
        (isLock ? (
          <CommonBtn
            onClick={() => {
              setIsUnlockShow(true);
            }}
            className={`${styles.unlockBtn} !bg-[#A15A1C] ${isMobileStore ? '' : '!mt-[80px]'}`}
            title="Unlock"></CommonBtn>
        ) : isLogin || isOnChainLogin ? null : (
          <>
            {renderLoginMethods(false)}
            {!isInApp && (
              <div
                className={styles.more}
                onClick={() => {
                  setModalOpen();
                }}>
                More
              </div>
            )}
          </>
        ))}

      <Drawer
        open={drawerVisible}
        placement={'bottom'}
        className={styles.loginMethodDrawer}
        onClose={() => {
          closeModal();
        }}
        maskClosable={true}>
        {renderMoreContent()}
      </Drawer>

      <Modal
        open={modalVisible}
        className={styles.loginMethodModal}
        onCancel={() => closeModal()}
        maskClosable={true}
        closable={false}>
        {renderMoreContent()}
      </Modal>

      <SignIn
        pin={isTelegramPlatform ? DEFAULT_PIN : undefined}
        keyboard
        ref={signInRef}
        design={design}
        defaultLifeCycle={currentLifeCircle}
        className={style}
        onFinish={handleOnChainFinishWrapper}
        onCreatePending={handleCreatePending}
        beforeCreatePending={beforeCreatePending}
        onLifeCycleChange={onLifeCycleChange}
        onError={handleSDKLogoutOffChain}
        isShowScan={true}
        defaultChainId={curChain}
      />

      {guardianList?.length && (
        <GuardianApprovalModal
          open={approvalVisible}
          isAsyncVerify
          networkType={network as NetworkType}
          caHash={caHash}
          originChainId={originChainId}
          targetChainId={curChain}
          guardianList={guardianList}
          operationType={OperationTypeEnum.communityRecovery}
          operationDetails={getOperationDetails(OperationTypeEnum.communityRecovery)}
          onClose={() => setApprovalVisible(false)}
          onBack={() => setApprovalVisible(false)}
          onApprovalSuccess={onTGSignInApprovalSuccess}
        />
      )}

      <Unlock
        keyboard
        onUnlock={unlock}
        open={isUnlockShow}
        onCancel={() => {
          setIsUnlockShow(false);
        }}
        value={passwordValue}
        onChange={(v) => {
          setIsErrorTipShow(false);
          setPasswordValue(v);
        }}
        isWrongPassword={isErrorTipShow}
        footer={forgetPinElement}
      />

      {!isTelegramPlatform && <ShowPageLoading open={showPageLoading} />}
    </div>
  );
};

export default Login;
