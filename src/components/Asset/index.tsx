import { Asset, PortkeyAssetProvider } from '@portkey/did-ui-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import { LeftOutlined } from '@ant-design/icons';
import styles from './style.module.css';
import { StorageUtils } from 'utils/storage.utils';

export default function MyAsset() {
  const router = useRouter();
  const { walletInfo, walletType, isLogin, isTgInit, isOnChainLogin, configInfo } = useGetState();
  const { isShowRampBuy, isShowRampSell } = configInfo!;
  useEffect(() => {
    if (!isLogin && !isOnChainLogin && !isTgInit) {
      router.push('/login');
    } else if (walletType !== WalletType.portkey) {
      router.push('/');
    }
  }, [isLogin, isOnChainLogin, router, walletType, isTgInit]);

  const originChainId = StorageUtils.getOriginChainId() || '';

  return (
    <div className={styles.asset}>
      <PortkeyAssetProvider
        originChainId={(originChainId || walletInfo?.portkeyInfo?.chainId) as Chain}
        pin={walletInfo?.portkeyInfo?.pin}
        caHash={walletInfo?.portkeyInfo?.caInfo?.caHash}
        isLoginOnChain={isOnChainLogin}
        didStorageKeyName={StorageUtils.getWalletKey()}>
        <Asset
          isShowRamp={isShowRampBuy || isShowRampSell}
          isShowRampBuy={isShowRampBuy}
          isShowRampSell={isShowRampSell}
          faucet={{
            faucetContractAddress: configInfo?.faucetContractAddress,
          }}
          backIcon={<LeftOutlined />}
          onOverviewBack={() => router.back()}
          onLifeCycleChange={(lifeCycle) => {
            console.log(lifeCycle, 'onLifeCycleChange');
          }}
        />
      </PortkeyAssetProvider>
    </div>
  );
}
