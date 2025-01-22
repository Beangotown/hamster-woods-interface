import { TAelfAccounts } from '@etransfer/ui-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectInfo } from 'redux/reducer/info';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';

export function useAddress() {
  const [address, setAddress] = useState<string>('');
  const { walletType, walletInfo } = useSelector(selectInfo);
  useEffect(() => {
    if (walletType === WalletType.discover) {
      setAddress(walletInfo?.discoverInfo?.address || '');
    } else if (walletType === WalletType.portkey) {
      setAddress(walletInfo?.portkeyInfo?.caAddress || '');
    }
  }, [walletInfo, walletType]);

  return address;
}

export function useETransferAccounts() {
  const { configInfo } = useGetState();
  const { curChain } = configInfo!;
  const address = useAddress();

  const accounts: TAelfAccounts = {
    AELF: 'ELF_' + address + '_' + 'AELF',
    [curChain]: 'ELF_' + address + '_' + curChain,
  };

  return accounts;
}
