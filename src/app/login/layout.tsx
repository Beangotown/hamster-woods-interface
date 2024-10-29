'use client';
import React, {
  useEffect,
  useMemo,
  // useRef,
  useState,
} from 'react';

import LoadingAnimation from 'components/Loading/LoadingAnimation';

// import dynamic from 'next/dynamic';

import { store } from 'redux/store';
import { setLoginStatus } from 'redux/reducer/info';
import { did, TelegramPlatform } from '@portkey/did-ui-react';

import { useRouter } from 'next/navigation';
import useGetState from 'redux/state/useGetState';
import { LoginStatus } from 'redux/types/reducerTypes';
import { StorageUtils } from 'utils/storage.utils';
import { initVConsole } from 'utils/vconsole';

// const MAX_SINGLE_REQUEST_TIME = 3 * 1000;
// const MAX_SHEDULE_TIME = 30 * 1000;

// const Layout = dynamic(
//   async () => {
//     return (props: React.PropsWithChildren<{}>) => {
const Layout = (props: React.PropsWithChildren<{}>) => {
  const { children } = props;

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
      initVConsole();
    }
  }, []);

  // const unLoadSourceRef = useRef(0);

  const [hasLoadedSource, setHasLoadedSource] = useState(false);

  const { isMobile: isMobileStore, chessBoardInfo, imageResources, btnImageResources } = useGetState();

  const router = useRouter();

  // const [resurceList, setResurceList] = useState<Array<string>>([]);

  // const [chessMap, setChessMap] = useState<Array<string>>([]);

  // const [sourceLoded, setSourceLoded] = useState(false);

  // const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setHasLoadedSource(true);
    }, 1000);
  }, []);

  // const loadResourceList = () => {
  //   if (!chessMap.length && !resurceList.length) {
  //     setTimeout(() => {
  //       setHasLoadedSource(true);
  //     }, 1000);
  //   }
  //   const sourceMap = [...resurceList, ...chessMap];

  //   const timeTask = new Promise(function (resolve) {
  //     setTimeout(resolve, MAX_SHEDULE_TIME, false);
  //   });

  //   const scheduleTask = new Promise(function (resolve) {
  //     const start = Date.now();
  //     const schedule = (src: string) => {
  //       const img = document.createElement('img');
  //       img.src = src;
  //       const len = sourceMap.filter((i) => i).length;
  //       img.onload = img.onerror = () => {
  //         unLoadSourceRef.current = unLoadSourceRef.current + 1;
  //         if (unLoadSourceRef.current >= len) {
  //           if (Date.now() - start > MAX_SINGLE_REQUEST_TIME) {
  //             resolve(true);
  //           } else {
  //             setTimeout(() => {
  //               resolve(true);
  //             }, MAX_SINGLE_REQUEST_TIME - (Date.now() - start));
  //           }
  //         }
  //       };
  //     };
  //     sourceMap.forEach((src) => {
  //       schedule(src);
  //     });
  //   });

  //   Promise.race([timeTask, scheduleTask]).then(() => {
  //     console.log('over');
  //     setHasLoadedSource(true);
  //   });
  // };

  useEffect(() => {
    if (typeof window !== undefined) {
      if (window.localStorage.getItem(StorageUtils.getWalletKey())) {
        did.reset();
        console.log('wfs setLoginStatus=>1');
        store.dispatch(setLoginStatus(LoginStatus.LOCK));
      }
    }
  }, []);

  // useEffect(() => {
  //   sourceLoded && loadResourceList();
  // }, [sourceLoded]);

  // useEffect(() => {
  //   if (!chessBoardInfo || !imageResources) return;

  //   const bgPc = imageResources['game-bg-pc'];
  //   const bgM = imageResources['game-bg-mobile-mask'];

  //   let imageResourcesArray: Array<string> = [];
  //   for (const picName in imageResources) {
  //     if (picName !== 'aloginBgPc' && picName !== 'aloginBgMobile') {
  //       imageResourcesArray.push(imageResources[picName]);
  //     }
  //   }
  //   const btnResources = isMobileStore ? btnImageResources!.mobile : btnImageResources!.pc;
  //   for (const picName in btnResources) {
  //     imageResourcesArray.push(btnResources[picName]);
  //   }
  //   imageResourcesArray = [isMobileStore ? bgM : bgPc, ...imageResourcesArray];

  //   setResurceList(imageResourcesArray);
  //   const chessMap: string[] = [];
  //   if (chessBoardInfo.length) {
  //     chessBoardInfo.forEach((item, index) => {
  //       item.forEach((_, index1) => {
  //         chessMap.push(chessBoardInfo[index][index1].image!);
  //       });
  //     });
  //   }
  //   setChessMap(chessMap);
  //   setSourceLoded(true);
  // }, [chessBoardInfo]);

  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const isTelegramPlatform = useMemo(() => {
    // TODO test data
    // return true;
    return TelegramPlatform.isTelegramPlatform();
  }, []);

  return hasLoadedSource && !isTelegramPlatform ? (
    <>
      {children}
      <div
        className="w-[100vw] h-[100vh] absolute top-0 left-0 !bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: isTelegramPlatform
            ? ''
            : `url(${
                require(isMobileStore ? 'assets/images/bg/game-bg-mobile-mask.png' : 'assets/images/bg/game-bg-pc.png')
                  .default.src
              })`,
        }}></div>
    </>
  ) : (
    <>
      {isTelegramPlatform && hasLoadedSource && children}
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

//   ,{ ssr: false },
// );

export default Layout;
