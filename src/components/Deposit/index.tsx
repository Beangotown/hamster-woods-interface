import styles from './style.module.css';
import { ComponentStyle, Deposit, ETransferDepositProvider } from '@etransfer/ui-react';
import { useIsMobile } from 'redux/selector/mobile';
import CustomModal from 'components/CustomModal';
import { ModalProps } from 'antd';
import TipIcon from 'assets/images/tip.png';
import { useSelector } from 'react-redux/es/hooks/useSelector';
import openPage from 'utils/openPage';
import { AppState } from 'redux/store';
import { useEffect } from 'react';
import { etransferEvents } from '@etransfer/utils';
import { useQueryAuthToken } from 'hooks/authToken';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';

export default function DepositModal(
  props: ModalProps & {
    onCancel: () => void;
  },
) {
  const { open } = props;
  const isMobile = useIsMobile();
  const { configInfo } = useSelector((state: AppState) => state.configInfo);
  const { getETransferAuthTokenFromApi } = useQueryAuthToken();
  const { isOnChainLogin, walletType } = useGetState();

  useEffect(() => {
    if (!isOnChainLogin && walletType === WalletType.portkey) {
      return;
    }
    const { remove } = etransferEvents.DeniedRequest.addListener(() => {
      getETransferAuthTokenFromApi();
    });
    return () => remove();
  }, [getETransferAuthTokenFromApi, isOnChainLogin, walletType]);

  return (
    <CustomModal
      className={`${isMobile ? '!w-[358px]' : '!w-[1000px] md:!w-[1000px]'} `}
      open={open}
      centered
      title="Buy $ACORNS with $USDT"
      {...props}>
      <div
        className={`overflow-auto mb-[8px] [&::-webkit-scrollbar]:hidden ${
          isMobile ? 'max-h-[50vh] h-[42rem]]' : 'h-[40rem]'
        }`}>
        <div className={`flex justify-start space-x-[8px] ${isMobile ? 'mb-2' : 'mb-4'}`}>
          <img
            width={isMobile ? 20 : 24}
            height={isMobile ? 20 : 24}
            className={`${isMobile ? 'w-[20px] h-[20px]' : 'w-[16Px] h-[16Px]'} mt-[2Px]`}
            src={TipIcon.src}
            alt="tip"
          />
          <div className={`${isMobile ? 'text-[10px] leading-[18px]' : 'text-[20px] leading-[24px]'}  font-bold`}>
            {`To acquire more $ACORNS, it's recommended to use the crosschain tool, ETransfer, which allows you to swap
            $USDT directly for $ACORNS. If you need help using `}
            <span
              className="underline font-black text-[#3989FF]"
              onClick={() => openPage(configInfo?.eTransferTutorialUrl ?? '')}>
              ETransfer
            </span>{' '}
            {`, feel free to check out the tutorial.`}
          </div>
        </div>

        <ETransferDepositProvider>
          <Deposit
            className={isMobile ? styles.mobileDepositWrap : styles.pcDepositWrap}
            componentStyle={isMobile ? ComponentStyle.Mobile : ComponentStyle.Web}
          />
        </ETransferDepositProvider>
      </div>
    </CustomModal>
  );
}
