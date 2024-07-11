import CustomModal, { ICustomModalProps } from 'components/CustomModal';
import NeatImageIcon from 'assets/images/neat.png';
import CommonBtn from 'components/CommonBtn';
import { useIsMobile } from 'redux/selector/mobile';
import { useMemo } from 'react';
import openPage from 'utils/openPage';
import { AppState } from 'redux/store';
import { useSelector } from 'react-redux';

export default function GetMoreACORNSModal({ open, onCancel, ...props }: ICustomModalProps) {
  const { configInfo } = useSelector((state: AppState) => state.configInfo);
  const isMobile = useIsMobile();
  const textClassName = useMemo(
    () => `${isMobile ? 'text-[16px] leading-[24px]' : 'text-[24px] leading-[32px]'} mb-[12px]`,
    [isMobile],
  );

  return (
    <CustomModal
      open={open}
      centered
      onCancel={onCancel}
      {...props}
      title={
        <div className="flex items-center justify-center gap-[10px] font-paytone">
          Acquire <img width={26} className="w-[26px] h-[26px]" src={NeatImageIcon.src} alt="neat" /> $ACORNS
        </div>
      }>
      <div className={textClassName}>
        {`$ACORNS is a crypto asset which can both be earned via Hamster Woods gameplay and traded on decentralised
        exchange.`}
      </div>
      <div
        className={
          textClassName
        }>{`To acquire more $ACORNS, it's recommended to use AwakenSwap where trading pairs like ACORNS/ELF or ACORNS/USDT are supported.`}</div>
      <div className={textClassName}>
        If you need help using{' '}
        <span
          onClick={() => {
            openPage(configInfo?.awakenTutorialUrl ?? '');
          }}
          className="underline text-[#3989FF] font-[600]">
          AwakenSwap
        </span>
        , feel free to check out the tutorial.
      </div>
      <CommonBtn
        className={`${
          isMobile
            ? '!h-[44px] !text-[20px] !leading-[20px] my-[24px]'
            : '!h-[76px] !text-[32px] !leading-[40px] mx-[64px] my-[40px]'
        } flex justify-center items-center font-paytone`}
        title="Trade on AwakenSwap"
        onClick={() => {
          openPage(`${configInfo?.awakenUrl}/trading/ACORNS_ELF_0.3`);
          onCancel?.();
        }}
      />
    </CustomModal>
  );
}
