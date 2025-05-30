'use client';
import React, { useEffect } from 'react';
import LoadingAnimation from 'components/Loading/LoadingAnimation';
import dynamic from 'next/dynamic';
// import { useRouter } from 'next/navigation';
import useGetState from 'redux/state/useGetState';
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

      // const router = useRouter();

      // useEffect(() => {
      //   router.prefetch('/');
      // }, [router]);

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
          {children}
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
