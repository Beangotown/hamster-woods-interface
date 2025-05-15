import styles from './style.module.css';
import { useIsMobile } from 'redux/selector/mobile';
import CustomModal from 'components/CustomModal';
import { ModalProps } from 'antd';
import { ComponentType, Swap, ISwapProps } from '@portkey/trader-react-ui';
import { AwakenSwapper, IPortkeySwapperAdapter } from '@portkey/trader-core';
import useWebLogin from 'hooks/useWebLogin';
import '@portkey/trader-react-ui/dist/assets/index.css';
import { WalletType } from 'types';
import useGetState from 'redux/state/useGetState';
import { useEffect, useRef } from 'react';

export default function AwakenSwapModal(
  props: ModalProps &
    ISwapProps & {
      onCancel: () => void;
    },
) {
  const awakenInstanceRef = useRef<IPortkeySwapperAdapter>();
  const { open, selectTokenInSymbol, selectTokenOutSymbol, onCancel } = props;
  const { getOptions, tokenApprove, walletType } = useWebLogin();
  const isMobile = useIsMobile();
  const { configInfo } = useGetState();

  useEffect(() => {
    if (!configInfo) return;

    awakenInstanceRef.current = new AwakenSwapper({
      contractConfig: {
        swapContractAddress: configInfo?.awakenSwapContractAddress,
        rpcUrl: configInfo?.rpcUrl || '',
      },
      requestDefaults: {
        baseURL: configInfo?.awakenUrl,
      },
    });
  }, [configInfo, configInfo?.awakenSwapContractAddress, configInfo?.awakenUrl, configInfo?.rpcUrl]);

  return (
    <CustomModal
      className={`${isMobile ? '!w-[358px]' : '!w-[1000px] md:!w-[1000px]'} `}
      open={open}
      centered
      title="Swap"
      destroyOnClose
      {...props}>
      <div
        className={`overflow-auto mb-[8px] [&::-webkit-scrollbar]:hidden ${
          isMobile ? 'max-h-[50vh] h-[42rem]]' : 'h-[40rem]'
        }`}>
        <Swap
          selectTokenInSymbol={selectTokenInSymbol}
          selectTokenOutSymbol={selectTokenOutSymbol}
          containerClassName={styles.awakenWrap}
          componentUiType={isMobile ? ComponentType.Mobile : ComponentType.Web}
          onConfirmSwap={onCancel}
          chainId={configInfo?.curChain}
          awaken={{
            instance: awakenInstanceRef.current,
            tokenApprove: walletType === WalletType.discover ? undefined : tokenApprove,
            getOptions,
          }}
        />
      </div>
    </CustomModal>
  );
}
