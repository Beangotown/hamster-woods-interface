import { ChainId } from '@portkey/types';
import { did } from '@portkey/did-ui-react';
import { WebWalletInfoType } from 'types';

export default async function getAccountInfoSync(chainId: string, didWalletInfo?: WebWalletInfoType) {
  const currentChainId = chainId as ChainId;
  const holder = await did.didWallet.getHolderInfoByContract({
    chainId: currentChainId,
    caHash: didWalletInfo?.caHash,
  });
  const filteredHolders = holder.managerInfos.filter((manager) => manager?.address === didWalletInfo?.managerAddress);
  console.log({ holder, filteredHolders });

  return { holder, filteredHolders };
}
