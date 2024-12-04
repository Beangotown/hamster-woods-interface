import CommonBtn from 'components/CommonBtn';
import CustomModal, { ICustomModalProps } from 'components/CustomModal';
import useCountdown from 'hooks/useCountDown';
import { useMemo } from 'react';
import { useIsMobile } from 'redux/selector/mobile';
import { useSelector } from 'redux/store';
import { formatTime } from 'utils/formatTime';

export enum PurchaseNoticeEnum {
  hop = 'hop',
  getChance = 'getChance',
}

export interface IPurchaseNoticeModalProps extends ICustomModalProps {
  onConfirm: () => void;
  type: PurchaseNoticeEnum;
}

export default function PurchaseNoticeModal({ onConfirm, type, ...props }: IPurchaseNoticeModalProps) {
  const { hours, minutes, seconds } = useCountdown();
  const isMobile = useIsMobile();
  const { serverConfigInfo } = useSelector((state) => state.serverConfigInfo);

  const noticeText = useMemo(() => {
    if (type === PurchaseNoticeEnum.hop) {
      return `Your hamster has used all its HOPs for today and reached the weekly purchase limit of ${serverConfigInfo?.weeklyBuyChanceCount} hopping chances. Give it a rest and come back when new HOPs are available in `;
    }
    if (type === PurchaseNoticeEnum.getChance) {
      return `Your hamster reached the weekly purchase limit of ${serverConfigInfo?.weeklyBuyChanceCount} hopping chances. Give it a rest and come back when new HOPs are available in `;
    }
    return '';
  }, [serverConfigInfo?.weeklyBuyChanceCount, type]);

  return (
    <CustomModal {...props} title="Notice" onCancel={onConfirm}>
      <div className={'text-[24px] leading-8'}>
        {noticeText}
        <span className="font-black">
          {formatTime({
            hours,
            minutes,
            seconds,
          })}
        </span>
        {` .`}
      </div>
      <CommonBtn
        title={'OK'}
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
