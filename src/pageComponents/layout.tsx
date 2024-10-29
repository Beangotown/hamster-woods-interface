'use client';
import { Layout as AntdLayout } from 'antd';
import Header from 'components/Header';
import React, { useEffect, useState } from 'react';

// import 'utils/firebase';

import dynamic from 'next/dynamic';

import { ConfigProvider, TelegramPlatform, did } from '@portkey/did-ui-react';
import { setIsMobile, setLoginStatus } from 'redux/reducer/info';
import { store } from 'redux/store';
import isMobile from 'utils/isMobile';
import { Store } from 'utils/store';

import { usePathname, useRouter } from 'next/navigation';

import { fetchConfigItems, fetchServerConfig } from 'api/request';
import { HAMSTER_PROJECT_CODE } from 'constants/login';
import { TELEGRAM_BOT_ID } from 'constants/platform';
import { convertToUtcTimestamp } from 'hooks/useCountDown';
import { setConfigInfo } from 'redux/reducer/configInfo';
import { setServerConfigInfo } from 'redux/reducer/serverConfigInfo';
import useGetState from 'redux/state/useGetState';
import { LoginStatus } from 'redux/types/reducerTypes';
import { getCurrentIp } from 'utils/ip';
import { StorageUtils } from 'utils/storage.utils';

did.setConfig({
  referralInfo: {
    referralCode: '',
    projectCode: HAMSTER_PROJECT_CODE,
  },
});

let isHandleSDKLogout = false;

export const isCurrentTimeInterval = (date: [string, string]) => {
  const startTime = new Date(date[0]).getTime();
  const endTime = new Date(date[1]).getTime();
  const now = convertToUtcTimestamp(new Date().getTime());

  if (now >= startTime && now <= endTime) {
    return true;
  }
  return false;
};

const Layout = dynamic(
  async () => {
    return (props: React.PropsWithChildren<{}>) => {
      // const router = useRouter();
      // useEffect(() => {
      //   console.log('mount!', pathname);
      //   return () => {
      //     console.log('un mount!', pathname);
      //   };
      // }, []);
      // return null;
      const { children } = props;
      const { isInit, isLogin, isOnChainLogin } = useGetState();
      const [isMobileDevice, setIsMobileDevice] = useState(false);
      const [isFetchFinished, setIsFetchFinished] = useState(false);

      const router = useRouter();

      useEffect(() => {
        if (!window || !document) return;
        const docEle = document.documentElement;
        const event = 'onorientationchange' in window ? 'orientationchange' : 'resize';
        const fn = function () {
          const isMobile =
            TelegramPlatform.isTelegramPlatform() ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const width = docEle.clientWidth;
          const unitWidth = isMobile ? 390 : 1920;
          if (width) {
            if (isMobile && width > 580) {
              docEle.style.fontSize = '16px';
            } else if (!isMobile && width < 1200) {
              docEle.style.fontSize = '10px';
            } else {
              docEle.style.fontSize = 16 * (width / unitWidth) + 'px';
            }
          }
        };
        fn();
        window.addEventListener(event, fn, false);
        document.addEventListener('DOMContentLoaded', fn, false);
        return () => {
          window.removeEventListener(event, fn, false);
          document.removeEventListener('DOMContentLoaded', fn, false);
        };
      }, []);

      useEffect(() => {
        console.log('wfs common layout isLogin', isLogin, 'isOnChainLogin', isOnChainLogin);
        if (!isLogin && !isOnChainLogin) {
          router.replace('/login');
        }

        if (typeof window !== undefined) {
          if (window.localStorage.getItem(StorageUtils.getWalletKey()) && isInit) {
            did.reset();
            console.log('wfs setLoginStatus=>12', pathname);
            store.dispatch(setLoginStatus(LoginStatus.LOCK));
          }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      useEffect(() => {
        (async () => {
          const ip = await getCurrentIp();
          const activityId = (window?.Telegram?.WebApp?.initDataUnsafe?.start_param || '') as string;

          did.setConfig({
            extraInfo: {
              ip,
              activityId,
            },
          });
        })();
      }, []);

      const initConfigAndResource = async () => {
        const serverConfigPromise = fetchServerConfig();
        const configPromise = fetchConfigItems();

        configPromise.then(async (res) => {
          store.dispatch(
            setConfigInfo({
              ...res.data,
              isHalloween: false,
            }),
          );
          ConfigProvider.setGlobalConfig({
            storageMethod: new Store(),
            requestDefaults: {
              baseURL: res.data.portkeyServer,
            },
            serviceUrl: res.data.portkeyServiceUrl,
            graphQLUrl: res.data.graphqlServer,
            socialLogin: {
              Telegram: {
                botId: TELEGRAM_BOT_ID,
              },
            },
          });
          if (!isHandleSDKLogout) {
            isHandleSDKLogout = true;
            // TelegramPlatform.initializeTelegramWebApp({ tgUserChanged: ()=>{} });
          }
        });

        serverConfigPromise.then((res) => {
          console.log('===serverConfig', res);
          store.dispatch(setServerConfigInfo(res));
        });
        const _timerLabel = 'timer--' + Math.random() + ' ' + Math.random();
        console.time(_timerLabel);
        Promise.all([configPromise, serverConfigPromise]).then(() => {
          setIsFetchFinished(true);
          console.timeEnd(_timerLabel);
        });
      };

      useEffect(() => {
        initConfigAndResource();

        const resize = () => {
          const ua = navigator.userAgent;
          const mobileType = isMobile(ua);
          const isMobileDevice =
            mobileType.apple.phone ||
            mobileType.android.phone ||
            mobileType.apple.tablet ||
            mobileType.android.tablet ||
            TelegramPlatform.isTelegramPlatform();
          setIsMobileDevice(isMobileDevice);
          store.dispatch(setIsMobile(isMobileDevice));
        };
        resize();
        window.addEventListener('resize', resize);
        return () => {
          window.removeEventListener('resize', resize);
        };
      }, []);

      const pathname = usePathname();

      if (!isFetchFinished) {
        return null;
      }

      if ((isLogin || isOnChainLogin) && pathname === '/') {
        return (
          <AntdLayout className="xx-wrapper flex h-full w-[100vw] flex-col overflow-hidden">
            {isMobileDevice && <Header />}
            <AntdLayout.Content
              className="marketplace-content flex-1 overflow-hidden relative"
              id="marketplace-content">
              {children}
              <div className="absolute top-0 w-full h-full bg-[#8FBC30]"></div>
            </AntdLayout.Content>
          </AntdLayout>
        );
      }

      return (
        <>
          {children}
          <div
            className={`absolute top-0 w-full h-full ${
              pathname === '/login' ? 'bg-[#8FBC30]' : 'bg-gray-100'
            } z-[-1]`}></div>
        </>
      );
    };
  },
  { ssr: false },
);

export default Layout;
