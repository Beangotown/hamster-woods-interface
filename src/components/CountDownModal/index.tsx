'use client';
import { MouseEvent } from 'react';

import CommonBtn from 'components/CommonBtn';
import useCountdown from 'hooks/useCountDown';
import { formatTime } from 'utils/formatTime';
import CustomModal from 'components/CustomModal';
import { useIsMobile } from 'redux/selector/mobile';

export type CountDownModalPropsType = {
  onConfirm?: (e: MouseEvent<any>) => void;
  onCancel: () => void;
  open: boolean;
  btnText?: string;
};

export default function CountDownModal({ onCancel, open, onConfirm, btnText }: CountDownModalPropsType) {
  const { hours, minutes, seconds } = useCountdown();
  const isMobile = useIsMobile();
  return (
    <CustomModal open={open} title="Notice" onCancel={onCancel} destroyOnClose className={`flex justify-center`}>
      <p className={isMobile ? 'text-[16px] leading-6' : 'text-[24px] leading-8'}>
        {`Your hamster has used up all its HOPs for today. New HOPs will be available in `}
        <span className="font-black">
          {formatTime({
            hours,
            minutes,
            seconds,
          })}
        </span>
      </p>
      <p className={isMobile ? 'text-[16px] leading-6' : 'text-[24px] leading-8'}>
        {`If you want to help it hop some more, click the button below to get more chances.`}
      </p>
      <CommonBtn
        title={btnText || 'Confirm'}
        className={`flex justify-center items-center font-paytone ${
          isMobile
            ? '!text-[20px] !leading-[20px] mt-[24px] h-[48px]'
            : '!text-[32px] !leading-[40px] mt-[40px] !h-[76px] mx-[64px]'
        }`}
        onClick={onConfirm}
      />
    </CustomModal>
  );
}
