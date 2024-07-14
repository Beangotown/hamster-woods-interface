import React, { ReactElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import styles from './index.module.css';
import useGetState from 'redux/state/useGetState';

export enum Status {
  LOADING = 'loading',
  DISABLED = 'disabled',
  NONE = 'none',
}

export enum ButtonStatus {
  DEFAULT = 'default',
  SELECTED = 'selected',
}

export interface IGoButton {
  status?: Status;
  hasNft?: boolean;
  playableCount?: number;
  dailyPlayableCount?: number;
  sumScore?: number;
  purchasedChancesCount?: number;
  curDiceCount?: number;
  changeCurDiceCount?: (num: number) => void;
  go?: () => void;
  getChance?: () => void;
  getMoreAcorns?: () => void;
  showLockedAcorns?: () => void;
}

function GoButton({
  go,
  status = Status.NONE,
  playableCount = 0,
  dailyPlayableCount = 5,
  purchasedChancesCount = 0,
  curDiceCount,
  changeCurDiceCount,
  getChance,
}: IGoButton) {
  const { isMobile } = useGetState();

  const diceCount = [1, 2, 3];
  const [, resetOverlayCount] = useState(0);
  const [curPress, setCurPress] = useState<number | null>(null);
  const [curTouch, setCurTouch] = useState<number | null>(null);

  const [chanceBtnPress, setChanceBtnPress] = useState<boolean>(false);
  const [chanceBtnPressM, setChanceBtnPressM] = useState<boolean>(false);
  const [chanceBtnTouch, setChanceBtnTouch] = useState<boolean>(false);

  const [curPressM, setCurPressM] = useState<number | null>(null);

  const [pcBtnMouseOn, setPcBtnMouseOn] = useState(false);

  const [pcBtnPress, setPcBtnPress] = useState(false);
  const [mBtnPress, setMBtnPress] = useState(false);

  const mobileDiceButtonRef = useRef<HTMLDivElement | null>(null);
  const mobileGoButtonRef = useRef<HTMLDivElement | null>(null);
  const mobileChanceButtonRef = useRef<HTMLDivElement | null>(null);
  const goFn = useRef(go);
  const changeCurDiceCountFn = useRef(changeCurDiceCount);

  useEffect(() => {
    goFn.current = go;
  }, [go]);

  useEffect(() => {
    changeCurDiceCountFn.current = changeCurDiceCount;
  }, [changeCurDiceCount]);

  const statusCom: Record<Status, ReactElement> = {
    [Status.NONE]: (
      <>
        <span
          className={`font-paytone font-[500] tracking-tight text-[#fff] text-stroke-[#52300B] ${
            isMobile ? 'text-[48px] leading-[48px] mt-[10px]' : 'text-[72px] leading-[72px] mb-[4px]'
          }`}>
          HOP
        </span>
        <span
          className={`${
            isMobile ? 'text-[10px] leading-[10px] mt-[10px]' : 'text-[18px] leading-[18px] mt-[4px]'
          } font-bold text-[#52300B]`}>
          {`free: ${playableCount}/${dailyPlayableCount} Paid: ${purchasedChancesCount}`}
        </span>
      </>
    ),
    [Status.LOADING]: (
      <div className={`${styles['button__icon__loading']} ${isMobile ? 'mt-[10px] w-[45px]' : 'mt-[16px] w-[85px]'}`}>
        <div className={styles['button__icon__loading__bounce1']}></div>
        <div className={styles['button__icon__loading__bounce2']}></div>
      </div>
    ),
    [Status.DISABLED]: (
      <>
        <span
          className={`font-paytone font-[500] tracking-tight text-[#fff] text-stroke-[#8E8E8E] ${
            isMobile ? 'text-[48px] leading-[48px] mt-[10px]' : 'text-[72px] leading-[72px] mb-[4px]'
          }`}>
          HOP
        </span>
        <span
          className={`${
            isMobile ? 'text-[10px] leading-[10px] mt-[10px]' : 'text-[21px] leading-[21px] mt-[4px]'
          } font-bold text-[#8E8E8E]`}>
          {`free: ${playableCount}/${dailyPlayableCount} Paid: ${purchasedChancesCount}`}
        </span>
      </>
    ),
  };

  const chooseDiceCount = (number: number) => {
    changeCurDiceCount && changeCurDiceCount(number);
  };

  const changeChance: EventListener = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    setChanceBtnPressM(true);
  }, []);

  const handleReleaseChance: EventListener = useCallback(
    (event) => {
      event.stopPropagation();
      event.stopImmediatePropagation();
      setChanceBtnPressM(false);
      getChance && getChance();
    },
    [getChance],
  );

  const changeDiceCount: EventListener = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const number = ((curDiceCount || 1) % diceCount.length) + 1;
      setCurPress(number);
      setCurPressM(number);
      changeCurDiceCountFn.current?.(number);
    },
    [curDiceCount, diceCount.length],
  );

  const handleReleaseDice: EventListener = useCallback((event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    setCurPress(null);
    setCurPressM(null);
  }, []);

  const handlePressGoButton: EventListener = useCallback((event) => {
    event.preventDefault();
    setMBtnPress(true);
  }, []);

  const handleReleaseGoButton: EventListener = useCallback((event) => {
    setMBtnPress(false);
    goFn.current?.();
  }, []);

  // Handle both touch and mouse events to support interaction in Telegram WebApp on PC
  useEffect(() => {
    const mobileGoButton = mobileGoButtonRef.current;
    if (!mobileGoButton) return;
    mobileGoButton.addEventListener('mousedown', handlePressGoButton);
    mobileGoButton.addEventListener('mouseup', handleReleaseGoButton);
    mobileGoButton.addEventListener('touchstart', handlePressGoButton, { passive: false });
    mobileGoButton.addEventListener('touchend', handleReleaseGoButton);

    return () => {
      mobileGoButton.removeEventListener('touchstart', handlePressGoButton);
      mobileGoButton.removeEventListener('mousedown', handlePressGoButton);
      mobileGoButton.removeEventListener('touchend', handleReleaseGoButton);
      mobileGoButton.removeEventListener('mouseup', handleReleaseGoButton);
    };
  }, [handlePressGoButton, handleReleaseGoButton, isMobile]);

  // Handle both touch and mouse events to support interaction in Telegram WebApp on PC
  useEffect(() => {
    const mobileDiceButton = mobileDiceButtonRef.current;
    if (!mobileDiceButton) return;
    mobileDiceButton.addEventListener('mousedown', changeDiceCount);
    mobileDiceButton.addEventListener('mouseup', handleReleaseDice);
    mobileDiceButton.addEventListener('touchstart', changeDiceCount, { passive: false });
    mobileDiceButton.addEventListener('touchend', handleReleaseDice);

    return () => {
      mobileDiceButton.removeEventListener('touchstart', changeDiceCount);
      mobileDiceButton.removeEventListener('mousedown', changeDiceCount);
      mobileDiceButton.removeEventListener('touchend', handleReleaseDice);
      mobileDiceButton.removeEventListener('mouseup', handleReleaseDice);
    };
  }, [changeDiceCount, handleReleaseDice, isMobile]);

  // Handle both touch and mouse events to support interaction in Telegram WebApp on PC
  useEffect(() => {
    const mobileChanceButton = mobileChanceButtonRef.current;
    if (!mobileChanceButton) return;
    mobileChanceButton.addEventListener('mousedown', changeChance);
    mobileChanceButton.addEventListener('mouseup', handleReleaseChance);
    mobileChanceButton.addEventListener('touchstart', changeChance, { passive: false });
    mobileChanceButton.addEventListener('touchend', handleReleaseChance);

    return () => {
      mobileChanceButton.removeEventListener('touchstart', changeChance);
      mobileChanceButton.removeEventListener('mousedown', changeChance);
      mobileChanceButton.removeEventListener('touchend', handleReleaseChance);
      mobileChanceButton.removeEventListener('mouseup', handleReleaseChance);
    };
  }, [changeChance, handleReleaseChance, isMobile]);

  useLayoutEffect(() => {
    resetOverlayCount((pre) => pre + 1);
  }, []);

  return (
    <div className={`${styles[isMobile ? 'button-mobile' : 'button']} relative w-full items-center`}>
      <div className="relative">
        {!isMobile && (
          <div className="flex items-center ml-[-24px]">
            {diceCount.map((item) => {
              return (
                <div
                  onMouseEnter={() => {
                    setCurTouch(item);
                  }}
                  onMouseLeave={() => {
                    setCurTouch(null);
                  }}
                  onMouseDown={() => {
                    if (curDiceCount === item) return;
                    chooseDiceCount(item);
                    setCurPress(item);
                  }}
                  onMouseUp={() => {
                    setCurPress(null);
                  }}
                  key={item}
                  style={{
                    backgroundImage: `url(${
                      require(`assets/images/btn/${
                        curDiceCount === item && curPress !== item
                          ? 'bg-dice-selected'
                          : curPress === item
                          ? 'bg-dice-press'
                          : curTouch === item && curDiceCount !== item
                          ? 'bg-dice-hover'
                          : 'bg-dice-default'
                      }.png`).default.src
                    })`,
                  }}
                  className={`${styles['dice-number']}`}
                  onClick={() => chooseDiceCount(item)}>
                  {curPress && curPress === item && <div className={styles['dice-content-mask']}></div>}

                  <img
                    src={require(`assets/images/btn/dice${item}.png`).default.src}
                    alt=""
                    className={`${styles['dice-content']} ${curPress === item && styles['dice-content-press']}`}
                  />
                </div>
              );
            })}
          </div>
        )}
        {isMobile ? (
          <div className={`${styles['button__border']} flex justify-center`}>
            <img
              className="absolute left-0 right-0 bottom-0 top-0"
              src={require('assets/images/goButton/go-btn-border.png').default.src}
              alt="border"
            />
            <div className={`${styles['btn-mobile']} ${styles['button__icon']} cursor-custom `}>
              <div
                style={{
                  backgroundImage: `url(${
                    require(`assets/images/btn/${chanceBtnPress ? 'bg-dice-press-m' : 'bg-dice-default-m'}.png`).default
                      .src
                  })`,
                }}
                ref={mobileChanceButtonRef}
                className={`relative ${styles['get-chance-mobile']} ${chanceBtnPressM ? 'top-[5px]' : ''}`}>
                {chanceBtnPressM && <div className={styles['dice-content-mobile-mask']}></div>}

                <div
                  className={`${styles['purchase-text-mobile']} text-white font-paytone w-[48px] mt-[12px] ml-[0.4rem] text-center text-[11px] !text-stroke-[#52300B]`}>
                  Purchase chance
                </div>
              </div>
              <div
                ref={mobileGoButtonRef}
                style={{
                  backgroundImage: `url(${
                    require(`assets/images/btn/${
                      mBtnPress ? 'bg-go-press-m' : status === Status.DISABLED ? 'bg-go-disabled-m' : 'bg-go-default-m'
                    }.png`).default.src
                  })`,
                }}
                className={`${mBtnPress ? 'top-[4px]' : ''} ${
                  status === Status.LOADING ? 'top-[12px] left-[64px]' : 'left-[0]'
                }  ${styles['hop-mobile']}`}>
                {mBtnPress && status === Status.NONE && <div className={styles['btn-mobile-mask']}></div>}
                {statusCom[status]}
              </div>
              <div
                style={{
                  backgroundImage: `url(${
                    require(`assets/images/btn/${
                      curDiceCount === curPressM ? 'bg-dice-press-m' : 'bg-dice-default-m'
                    }.png`).default.src
                  })`,
                }}
                className={`relative ${styles['dice-number-mobile']}`}
                ref={mobileDiceButtonRef}>
                {curPressM && <div className={styles['dice-content-mobile-mask']}></div>}

                <img
                  src={require(`assets/images/btn/dice${curDiceCount}-m.png`).default.src}
                  alt=""
                  className={`${styles['dice-content-mobile']} ${
                    curPressM === curDiceCount && styles['dice-content-mobile-press']
                  }`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center mb-[16px] ml-[-24px]">
            <div
              onMouseEnter={() => {
                setPcBtnMouseOn(true);
              }}
              onMouseLeave={() => {
                setPcBtnMouseOn(false);
              }}
              onMouseDown={() => {
                setPcBtnPress(true);
              }}
              onMouseUp={() => {
                setPcBtnPress(false);
                go && go();
              }}
              className={`${styles['btn-pc']} ${styles['button__icon']} ${
                styles[
                  pcBtnMouseOn && status === Status.NONE
                    ? 'hop-btn-pc-hover'
                    : pcBtnPress && status === Status.NONE
                    ? 'hop-btn-pc-pressed'
                    : status === Status.DISABLED
                    ? 'hop-btn-pc-disabled'
                    : 'hop-btn-pc-default'
                ]
              } cursor-custom relative flex items-center justify-center z-[11]  `}>
              {pcBtnPress && status === Status.NONE && <div className={styles['btn-pc-mask']}></div>}
              <div
                className={`${
                  pcBtnPress ? 'mt-[5px]' : ''
                } absolute top-[10px] flex ml-[12px] flex-col items-center justify-center`}>
                {statusCom[status]}
              </div>
            </div>
            <div
              onMouseEnter={() => {
                setChanceBtnTouch(true);
              }}
              onMouseLeave={() => {
                setChanceBtnTouch(false);
              }}
              onMouseDown={() => {
                setChanceBtnPress(true);
              }}
              onMouseUp={() => {
                setChanceBtnPress(false);
                getChance && getChance();
              }}
              style={{
                backgroundImage: `url(${
                  require(`assets/images/btn/${
                    chanceBtnPress ? 'get-chance-hover' : chanceBtnTouch ? 'get-chance-hover' : 'get-chance-default'
                  }.png`).default.src
                })`,
              }}
              className={`${styles['dice-number']} flex justify-center ${chanceBtnPress ? 'top-[5px]' : ''}`}>
              <span
                className={`font-paytone tracking-tight !text-stroke-[#52300B] text-[22px] leading-[22px] mt-[33px] text-white w-[110px] text-center ml-[15px]`}>
                Purchase chance
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(GoButton);
