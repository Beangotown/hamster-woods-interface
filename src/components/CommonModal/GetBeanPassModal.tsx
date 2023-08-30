'use client';
import Modal from './index';
import CommonBtn from 'components/CommonBtn';
import { BeanPassModalPropsType } from './type';
import { GetBeanPassStatus } from './type';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './style.module.css';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import getCountdown from 'utils/getCountdown';

export default function GetBeanPassModal({ type, ...props }: BeanPassModalPropsType) {
  const { walletType } = useGetState();
  const [countTime, setCountTime] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const interval = useRef<number | null>(null);
  useEffect(() => {
    interval.current = window.setInterval(() => {
      setCountTime(getCountdown());
    }, 1000);
    return () => {
      interval.current && window.clearInterval(interval.current);
    };
  }, []);
  const displayText = useMemo(() => {
    return {
      [GetBeanPassStatus.Recharge]: {
        title: 'Get a BeanPass',
        btnText: walletType !== WalletType.discover ? 'Go to wallet' : '',
        contentArr: [
          'You need to have a BeanPass NFT to start the game. ',
          'To claim the free BeanPass, please make sure your MainChain and SideChain balances combined to be no less than 5 ELF.',
        ],
      },
      [GetBeanPassStatus.Abled]: {
        title: 'Get a BeanPass',
        btnText: 'Get a BeanPass',
        contentArr: [
          'You need to have a BeanPass NFT to start the game！',
          'Click the button below to claim your BeanPass NFT!',
        ],
      },
      [GetBeanPassStatus.Noneleft]: {
        title: 'Get a BeanPass',
        btnText: 'I know',
        contentArr: [
          'You need to have a BeanPass NFT to start the game! ',
          `Today's BeanPass NFTs have all been claimed. Please come back tomorrow after ${countTime.hours}h : ${countTime.minutes}m for another try.`,
        ],
      },
      [GetBeanPassStatus.Notfound]: {
        title: 'Get a BeanPass',
        btnText: 'I know',
        contentArr: [
          'You need to have a BeanPass NFT to start the game!',
          `Since you have already claimed a BeanPass but it's not in your current wallet address now, please transfer it back or obtain a new one from other addresses.`,
        ],
      },
      [GetBeanPassStatus.Need]: {
        title: 'Notice',
        btnText: 'Confirm',
        contentArr: [`You'll need a BeanPass NFT to start the game.`],
      },
    }[type];
  }, [countTime.hours, countTime.minutes, type, walletType]);
  return (
    <Modal open={props.open} title={displayText.title} onCancel={props.onCancel} className={styles.getBeanPassModal}>
      <div className="mb-6 md:mb-[37px] md:text-[24px] md:leading-[32px]">
        {displayText.contentArr.map((text) => {
          return <p key={text}>{text}</p>;
        })}
      </div>
      {displayText.btnText && (
        <div className="mx-2">
          <CommonBtn title={displayText.btnText} onClick={props.onConfirm} className={styles.confirmBtn}></CommonBtn>
        </div>
      )}
    </Modal>
  );
}
