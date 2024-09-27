'use client';
import React, { useEffect, useState } from 'react';
import Header from 'components/Header';
import { Layout as AntdLayout } from 'antd';

// import 'utils/firebase';

import dynamic from 'next/dynamic';

import { store } from 'redux/store';
import { setIsMobile, setLoginStatus } from 'redux/reducer/info';
import isMobile from 'utils/isMobile';
import { Store } from 'utils/store';
import { handleSDKLogout } from 'utils/handleLogout';
import { ConfigProvider, TelegramPlatform, did } from '@portkey/did-ui-react';

import { useRouter, usePathname } from 'next/navigation';

import useGetState from 'redux/state/useGetState';
import { KEY_NAME, TELEGRAM_BOT_ID } from 'constants/platform';
import { LoginStatus } from 'redux/types/reducerTypes';
import {
  fetchChessboardConfig,
  fetchChessboardData,
  fetchConfigItems,
  fetchNoticeModal,
  fetchServerConfig,
} from 'api/request';
import { setConfigInfo } from 'redux/reducer/configInfo';
import { setChessboardData } from 'redux/reducer/chessboardData';
import { setNoticeModal } from 'redux/reducer/noticeModal';
import { convertToUtcTimestamp } from 'hooks/useCountDown';
import { setServerConfigInfo } from 'redux/reducer/serverConfigInfo';
import { HAMSTER_PROJECT_CODE } from 'constants/login';
import { getCurrentIp } from 'utils/ip';

did.setConfig({
  referralInfo: {
    referralCode: '',
    projectCode: HAMSTER_PROJECT_CODE,
  },
});

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
      const { children } = props;
      const { isLogin } = useGetState();
      const [isMobileDevice, setIsMobileDevice] = useState(false);
      const [isFetchFinished, setIsFetchFinished] = useState(false);

      const router = useRouter();

      useEffect(() => {
        TelegramPlatform.initializeTelegramWebApp({ handleLogout: handleSDKLogout });
      }, []);

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
        if (!isLogin) {
          router.replace('/login');
        }
        if (typeof window !== undefined) {
          if (window.localStorage.getItem(KEY_NAME)) {
            did.reset();
            store.dispatch(setLoginStatus(LoginStatus.LOCK));
          }
        }
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
        const chessboardConfigPromise = fetchChessboardConfig();
        const noticeModalPromise = fetchNoticeModal();

        chessboardConfigPromise.then((chessboardConfig) => {
          let url = 'chessboard_data';
          Object.keys(chessboardConfig.data).map((key) => {
            if (isCurrentTimeInterval(chessboardConfig.data[key])) {
              url = key;
            }
          });

          const serverConfigPromise = fetchServerConfig();
          const configPromise = fetchConfigItems();
          const chessBoardPromise = fetchChessboardData(url).then((res) => {
            store.dispatch(setChessboardData(res.data));
          });

          configPromise.then((res) => {
            store.dispatch(
              setConfigInfo({
                ...res.data,
                isHalloween: chessboardConfig?.data?.['chessboard_data_halloween']
                  ? isCurrentTimeInterval(chessboardConfig.data['chessboard_data_halloween'])
                  : false,
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
          });

          serverConfigPromise.then((res) => {
            console.log('===serverConfig', res);
            store.dispatch(setServerConfigInfo(res));
          });

          Promise.all([chessBoardPromise, configPromise, serverConfigPromise]).then((res) => {
            setIsFetchFinished(true);
          });
        });

        noticeModalPromise.then((res) => {
          if (res?.data?.halloween) {
            store.dispatch(
              setNoticeModal({
                ...res.data.halloween,
                open: false,
              }),
            );
          }
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

      if (isLogin && pathname === '/') {
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
