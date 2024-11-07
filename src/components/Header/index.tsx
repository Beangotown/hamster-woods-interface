import Wallet from './components/Wallet';
import Intro from './components/Intro';
import Setting from './components/Setting';
import styles from './style.module.css';
import useGetState from 'redux/state/useGetState';
import { WalletType } from 'types';
import { message, Tooltip } from 'antd';
import Image from 'next/image';
import AcornGetImage from 'assets/images/recreation/acorn-get.png';
import AcornWeeklyImage from 'assets/images/recreation/acorn-weekly.png';
import QuestionImage from 'assets/images/recreation/question.png';
import HeaderLockImage from 'assets/images/headerMenu/header-locked.png';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import LockedAcornsModal from 'components/LockedAcornsModal';
import { divDecimalsStrShow } from 'utils/calculate';
import { useIsMobile } from 'redux/selector/mobile';
import DepositModal from 'components/Deposit';
import { handleErrorMessage } from '@portkey/did-ui-react';
import { useQueryAuthToken } from 'hooks/authToken';
import Task from './components/Task';
import LoadingModal from 'components/LoadingModal';
// import useOpenGuardianApprove from 'hooks/useOpenGuardianApprove';

export default function Header() {
  const { walletType, isOnChainLogin, needSync } = useGetState();
  const { playerInfo } = useGetState();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [lockedAcornsVisible, setLockedAcornsVisible] = useState(false);
  const [depositVisible, setDepositVisible] = useState(false);
  const isMobile = useIsMobile();
  const allAcornsShow = useMemo(
    () => divDecimalsStrShow(playerInfo?.totalAcorns, playerInfo?.acornsDecimals),
    [playerInfo?.acornsDecimals, playerInfo?.totalAcorns],
  );
  const weeklyAcornsShow = useMemo(
    () => divDecimalsStrShow(playerInfo?.weeklyAcorns, playerInfo?.acornsDecimals),
    [playerInfo?.acornsDecimals, playerInfo?.weeklyAcorns],
  );
  const tooltipRef = useRef<any>(null);
  const { getETransferAuthToken } = useQueryAuthToken();
  const [syncLoading, setSyncLoading] = useState(false);
  // const { openGuardianApprove } = useOpenGuardianApprove();

  useEffect(() => {
    const handleDocumentClick = (event: any) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setTooltipOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const showDepositModal = useCallback(async () => {
    try {
      if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
        return setSyncLoading(true);
      }
      // if (openGuardianApprove()) {
      //   return;
      // }
      await getETransferAuthToken();
      setDepositVisible(true);
    } catch (error) {
      message.error(handleErrorMessage(error, 'Get etransfer auth token error'));
    }
  }, [getETransferAuthToken, isOnChainLogin, needSync, walletType]);

  return (
    <div className={styles.headerContainer}>
      <div className={`${styles.header__menu}`}>
        {walletType !== WalletType.discover && <Wallet />}
        <div className={`${walletType !== WalletType.discover ? 'mx-3' : ''}`}>
          <Task />
        </div>
        <div className="flex-grow"></div>
        <div className="mx-3">
          <Intro />
        </div>
        <Setting />
      </div>
      <div className={`${styles.header__menu} flex items-center gap-1`}>
        <div ref={tooltipRef} className={styles['board__acorn']}>
          <Image src={AcornGetImage} alt="bean" className="h-[30px] w-[30px]" onClick={showDepositModal} />
          <span className={`${styles['board__acorn__number']}`} onClick={showDepositModal}>
            {allAcornsShow}
          </span>
          <Tooltip
            title={
              <div
                className={`${
                  isMobile ? 'px-[12px] py-[8px] text-[12px]' : 'px-[24px] py-[16px] text-[18px] leading-[28px]'
                }`}>
                <div className="mb-[12px]">{`$ACORNS won through gameplay has a vesting period of 30 days, starting at the end of each week. Before unlocking, $ACORNS can't be used to purchase hopping chances, nor can it be transferred or traded.`}</div>
                <div className="">{`In the upcoming version, staking will be introduced, allowing token holders to stake $ACORNS for rewards.`}</div>
                <div
                  className={`text-right ${isMobile ? 'text-[16px]' : 'text-[24px]'}   leading-[28px]`}
                  onClick={() => setTooltipOpen(false)}>
                  OK
                </div>
              </div>
            }
            open={tooltipOpen}
            overlayStyle={{ maxWidth: isMobile ? 320 : 480, borderRadius: isMobile ? 16 : 32 }}
            overlayClassName={styles.board__tooltip}
            trigger={['click']}
            placement="bottom"
            color="#A15A1C">
            <Image
              src={QuestionImage}
              alt="bean"
              className="h-[16px] w-[16px] mr-[6px]"
              onClick={() => {
                setTooltipOpen(true);
              }}
            />
          </Tooltip>
        </div>
        <div className={styles['board__acorn']}>
          <Image src={AcornWeeklyImage} alt="bean" className="h-[30px] w-[30px]" />
          <span className={styles['board__acorn__number']}>{weeklyAcornsShow}</span>
        </div>
        <div className="flex-grow"></div>
        <Image
          height={40}
          onClick={() => setLockedAcornsVisible(true)}
          src={HeaderLockImage}
          alt="bean"
          className="h-[40px]  w-[40px]"
        />
      </div>
      <LockedAcornsModal open={lockedAcornsVisible} onCancel={() => setLockedAcornsVisible(false)} />

      <DepositModal open={depositVisible} onCancel={() => setDepositVisible(false)} />
      <LoadingModal open={syncLoading} onCancel={() => setSyncLoading(false)} />
    </div>
  );
}
