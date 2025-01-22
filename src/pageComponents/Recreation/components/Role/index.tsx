/* eslint-disable no-inline-styles/no-inline-styles */
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { ANIMATION_DURATION } from 'constants/animation';

import styles from './index.module.css';
import useGetState from 'redux/state/useGetState';
import beanTop from 'assets/base64/beanTop';
import beanRight from 'assets/base64/beanRight';
import beanLeft from 'assets/base64/beanLeft';
import beanImage from 'assets/base64/bean';

interface IRole {
  id?: string;
  width: string | number;
  bean?: number;
  translate: {
    x: number;
    y: number;
  };
  opacity?: number;
  animationDuration?: number;
  showAdd?: boolean;
  position?: {
    x?: number;
    y?: number;
  };
  hideAdd?: () => void;
  children?: React.ReactNode;
}

enum PlacementType {
  TOP = 'TOP',
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
}

function Role(props: IRole) {
  const {
    id = 'animationId',
    width,
    bean,
    opacity = 0,
    translate,
    animationDuration = ANIMATION_DURATION,
    showAdd,
    hideAdd,
    children,
    position,
  } = props;

  const [popoverPlacement, setPopoverPlacement] = useState<PlacementType>(PlacementType.TOP);
  const { isMobile } = useGetState();
  const popoverHeight = useRef<number>();
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const PopoverComponent = (
    <div className={`flex h-full items-center pb-[8px] ${styles['role__info']}`}>
      <img
        className={`${isMobile ? 'h-[32px] w-[32px]' : 'h-[64px] w-[64px] max-h-[64Px] max-w-[64Px]'}`}
        src={beanImage}
        alt="bean"
      />
      <span className={`ml-[4px] leading-[24px] text-[#FFFFFF] ${isMobile ? 'text-[20px]' : 'text-[40px]'}`}>
        +{bean}
      </span>
    </div>
  );

  const Popover: Record<PlacementType, ReactElement> = {
    [PlacementType.TOP]: (
      <div
        className={`relative flex h-full w-full justify-center bg-[100%_100%] bg-no-repeat ${styles['appears-animation']}`}
        style={{
          backgroundImage: `url(${beanTop})`,
          backgroundSize: '100% 100%',
          top: popoverHeight?.current ? `${popoverHeight.current * 0.8}px` : 0,
        }}>
        {PopoverComponent}
      </div>
    ),
    [PlacementType.RIGHT]: (
      <div
        className={`relative left-[90%] aspect-[89/44] w-full bg-[100%_100%] bg-no-repeat ${
          isMobile ? 'pl-[8px]' : 'pl-[18px]'
        } pt-[4px] ${styles['appears-animation-right']}`}
        style={{
          backgroundImage: `url(${beanRight})`,
          backgroundSize: '100% 100%',
          top: popoverHeight?.current ? `${popoverHeight.current * 1.2}px` : 0,
        }}>
        {PopoverComponent}
      </div>
    ),
    [PlacementType.LEFT]: (
      <div
        className={`relative aspect-[89/44] w-full bg-[100%_100%] bg-no-repeat ${
          isMobile ? 'pl-[4px]' : 'pl-[6px]'
        } pt-[4px] ${styles['appears-animation-left']}`}
        style={{
          backgroundImage: `url(${beanLeft})`,
          backgroundSize: '100% 100%',
          top: popoverHeight?.current ? `${popoverHeight.current * 1.2}px` : 0,
        }}>
        {PopoverComponent}
      </div>
    ),
  };

  useEffect(() => {
    if (showAdd) {
      const timer = setTimeout(() => {
        hideAdd && hideAdd();
        clearTimeout(timer);
      }, 1300);
    }
  }, [showAdd]);

  useEffect(() => {
    if (position) {
      switch (position.x) {
        case 0:
          if (position.y === 2 && isMobile) {
            setPopoverPlacement(PlacementType.LEFT);
            return;
          }
          setPopoverPlacement(PlacementType.RIGHT);
          return;
        case 1:
          if (position.y === 3 && isMobile) {
            setPopoverPlacement(PlacementType.LEFT);
            return;
          }
          setPopoverPlacement(PlacementType.TOP);
          return;
        case 2:
          if (position.y === 4 && isMobile) {
            setPopoverPlacement(PlacementType.LEFT);
            return;
          }
          setPopoverPlacement(PlacementType.TOP);
          return;
        default:
          setPopoverPlacement(PlacementType.TOP);
          return;
      }
    }
  }, [position]);

  useEffect(() => {
    popoverHeight.current = popoverRef.current?.clientHeight;
  }, []);

  return (
    <div
      id={id}
      className={`absolute bottom-0 right-0 z-50 flex items-center justify-center pb-[8px] pr-[12px]`}
      style={{
        width: width,
        opacity,
        transition: `transform ${animationDuration}ms linear`,
        transform: `translate(${translate.x}px, ${translate.y}px)`,
      }}>
      <div className="aspect-[56/60] w-full">
        <div className={styles.role}>
          <div ref={(ref) => (popoverRef.current = ref)} className="mb-[4px] aspect-[86/50] h-auto w-[150%]">
            {showAdd && bean && Popover[popoverPlacement]}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default React.memo(Role);
