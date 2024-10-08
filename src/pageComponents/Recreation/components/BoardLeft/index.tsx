import React from 'react';

import Wallet from 'components/Header/components/Wallet';
import Intro from 'components/Header/components/Intro';
import Setting from 'components/Header/components/Setting';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import styles from './index.module.css';
import Task from 'components/Header/components/Task';

function BoardLeft() {
  const { walletType } = useGetState();
  return (
    <div className={styles['game__pc__side']}>
      <div className="relative z-[30] flex h-full w-full min-w-[140px] flex-col items-end pr-[60px] pt-[60px]">
        {walletType !== WalletType.discover && (
          <div className="mb-[32px]">
            <Wallet />
          </div>
        )}
        <div className="mb-[32px]">
          <Task />
        </div>
        <div className="mb-[32px]">
          <Intro />
        </div>
        <div className="mb-[32px]">
          <Setting />
        </div>
      </div>
    </div>
  );
}

export default React.memo(BoardLeft);
