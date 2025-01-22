'use client';
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
import { LOGIN_EARGLY_KEY } from 'constants/platform';
import useWebLogin from 'hooks/useWebLogin';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { setLoginStatus } from 'redux/reducer/info';
import useGetState from 'redux/state/useGetState';
import { store } from 'redux/store';
import { LoginStatus } from 'redux/types/reducerTypes';
import { isTelegramPlatform } from 'utils/common';
import { getProto } from 'utils/deserializeLog';
import discoverUtils from 'utils/discoverUtils';
import isPortkeyApp from 'utils/inPortkeyApp';
import isMobile, { isMobileDevices } from 'utils/isMobile';
import { Proto } from 'utils/proto';
import styles from './style.module.css';
import { useConnect } from '@portkey/connect-web-wallet';

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

export default function Login() {
  const isGettingTelegramAuthRef = useRef(false);
  const { configInfo } = useGetState();
  // const { curChain, network } = configInfo!;
  const { connect, provider } = useConnect();

  const { handlePortKey, handleApple, handleGoogle, handleTeleGram, loginEagerly } = useWebLogin();

  const { isLock, isLogin, isOnChainLogin, isTgInit, isMobile: isMobileStore } = useGetState();

  const router = useRouter();

  const isInIOS = isMobile().apple.device;

  const isInApp = isPortkeyApp();

  console.log('isLock, isLogin,', isLock, isLogin);

  useEffect(() => {
    if (isLogin) {
      router.replace('/');
    }
  }, [isLogin]);

  useEffect(() => {
    if (typeof window !== undefined) {
      if (window.localStorage.getItem(LOGIN_EARGLY_KEY)) {
        loginEagerly();
      }
    }
  }, [loginEagerly]);

  useEffect(() => {
    if (isLock || isGettingTelegramAuthRef.current) {
      return;
    }
    if (typeof window !== undefined) {
      if (isTelegramPlatform) {
        isGettingTelegramAuthRef.current = true;
        handleTeleGram();
        store.dispatch(setLoginStatus(LoginStatus.TG_INIT));
      } else if (isPortkeyApp()) {
        handlePortKey();
      }
    }
  }, [isLock, handleTeleGram, handlePortKey, provider]);

  const closeModal = () => {
    setDrawerVisible(false);
    setModalVisible(false);
  };

  const loginSuccess = () => {
    closeModal();
    store.dispatch(setLoginStatus(LoginStatus.LOGGED));
  };

  const handleEmail = async () => {
    discoverUtils.removeDiscoverStorageSign();
    closeModal();
    await connect({
      otherLoginType: 'Email',
    });
    loginSuccess();
  };

  const handleQrcode = async () => {
    discoverUtils.removeDiscoverStorageSign();
    closeModal();
    await connect({
      otherLoginType: 'Qrcode',
    });
    loginSuccess();
  };

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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
        onclick: async () => {
          await handleGoogle();
          closeModal();
        },
        iconName: 'google',
        yellowColor: !inModel ? true : undefined,
      },
      {
        name: 'Login with Apple',
        onclick: async () => {
          await handleApple();
          closeModal();
        },
        yellowColor: !inModel ? true : undefined,
        iconName: 'apple',
      },
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

  useEffect(() => {
    if (isTelegramPlatform && isLock) {
      // TODO auto unLock
    }
  }, [isLock]);

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
            onClick={async () => {
              await connect();
              store.dispatch(setLoginStatus(LoginStatus.LOGGED));
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
    </div>
  );
}
