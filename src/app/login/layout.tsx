'use client';
import React, { useEffect } from 'react';

import LoadingAnimation from 'components/Loading/LoadingAnimation';

import dynamic from 'next/dynamic';

import { store } from 'redux/store';
import { setLoginStatus } from 'redux/reducer/info';
import { did } from '@portkey/did-ui-react';

import { useRouter } from 'next/navigation';
import useGetState from 'redux/state/useGetState';
import { LoginStatus } from 'redux/types/reducerTypes';
import { StorageUtils } from 'utils/storage.utils';
import { initVConsole } from 'utils/vconsole';
import { isTelegramPlatform } from 'utils/common';

const Layout = dynamic(
  async () => {
    return (props: React.PropsWithChildren<{}>) => {
      const { children } = props;

      useEffect(() => {
        if (process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
          initVConsole();
        }
      }, []);

      const { isMobile: isMobileStore } = useGetState();

      const router = useRouter();

      useEffect(() => {
        if (typeof window !== undefined) {
          if (window.localStorage.getItem(StorageUtils.getWalletKey())) {
            did.reset();
            console.log('wfs setLoginStatus=>1');
            store.dispatch(setLoginStatus(LoginStatus.LOCK));
          }
        }
      }, []);

      useEffect(() => {
        router.prefetch('/');
      }, []);

      return !isTelegramPlatform ? (
        <>
          {children}
          <div
            className="w-[100vw] h-[100vh] absolute top-0 left-0 !bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: isTelegramPlatform
                ? ''
                : `url(${
                    require(isMobileStore
                      ? 'assets/images/bg/game-bg-mobile-mask.png'
                      : 'assets/images/bg/game-bg-pc.png').default.src
                  })`,
            }}></div>
        </>
      ) : (
        <>
          {isTelegramPlatform && children}
          <LoadingAnimation />
          <div
            className="w-[100vw] h-[100vh] absolute top-0 left-0 !bg-cover bg-center bg-no-repeat z-[-1000]"
            style={{
              backgroundImage: `url(${
                require(isMobileStore ? 'assets/images/bg/game-bg-mobile-mask.png' : 'assets/images/bg/game-bg-pc.png')
                  .default.src
              })`,
            }}></div>
        </>
      );
    };
  },
  { ssr: false },
);

export default Layout;
