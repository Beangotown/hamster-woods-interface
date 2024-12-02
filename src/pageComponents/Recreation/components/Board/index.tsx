import React, { useCallback, useRef, useState, useEffect } from 'react';
import RankingImage from 'assets/images/recreation/ranking.png';
import NftImage from 'assets/images/recreation/nft.png';
import GoButton, { IGoButton, Status } from '../GoButton';
import useGetState from 'redux/state/useGetState';
import AcornGetImage from 'assets/images/recreation/acorn-get.png';
import AcornWeeklyImage from 'assets/images/recreation/acorn-weekly.png';
import AcornLockedImage from 'assets/images/recreation/acorn-locked.png';
import QuestionImage from 'assets/images/recreation/question.png';

import styles from './index.module.css';
import Image from 'next/image';
import { dispatch } from 'redux/store';
import { toggleShowLeaderboard } from 'redux/reducer/info';
import useInitLeaderBoard from 'components/Leaderboard/hooks/useInitLeaderBoard';
import { SentryMessageType, captureMessage } from 'utils/captureMessage';
import { Tooltip } from 'antd';
import { allAcornsTip } from 'constants/tip';
import { divDecimalsStrShow } from 'utils/calculate';

interface IBoard extends IGoButton {
  onNftClick?: () => void;
}

function Board({
  hasNft,
  go,
  status = Status.NONE,
  playableCount = 0,
  dailyPlayableCount = 5,
  onNftClick,
  curDiceCount,
  changeCurDiceCount,
  getChance,
  getMoreAcorns,
  showLockedAcorns,
  purchasedChancesCount,
}: IBoard) {
  const { isMobile, playerInfo, isTgInit } = useGetState();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef<any>(null);

  const { initialize } = useInitLeaderBoard();

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

  const handleShowLeaderboard = useCallback(async () => {
    if (isTgInit) return;
    try {
      await initialize();
    } catch (err) {
      captureMessage({
        type: SentryMessageType.ERROR,
        params: {
          name: 'useInitLeaderBoard',
          method: 'get',
          description: err,
        },
      });
    } finally {
      dispatch(toggleShowLeaderboard());
    }
  }, [initialize, isTgInit]);

  if (isMobile) {
    return (
      <div className="absolute right-[-70px] top-[8px] z-[40]">
        <div className={styles['board__feature__mobile']} onClick={handleShowLeaderboard}>
          <Image src={RankingImage} alt="bean" className="h-[36px] w-[36px]" />
          <span className={`${styles['board__feature__text']}`}>Leader Board</span>
        </div>
        <div className={styles['board__feature__mobile']} onClick={() => onNftClick && onNftClick()}>
          <Image src={NftImage} alt="bean" className="h-[36px] w-[36px]" />
          <span className={`${styles['board__feature__text']} `}>
            {hasNft ? 'HamsterPass NFT' : 'HamsterPass Giveaway'}
          </span>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex h-full w-full flex-col px-[47px] pt-[56px]">
        <div className="relative z-40 flex-1">
          <div ref={tooltipRef} className={styles['board__acorn']}>
            <Image src={AcornGetImage} alt="bean" className="h-[60px] w-[60px]" onClick={getMoreAcorns} />
            <span
              className={`${styles['board__acorn__number']} ${
                divDecimalsStrShow(playerInfo?.totalAcorns, playerInfo?.acornsDecimals).length > 16
                  ? '!text-[24px]'
                  : ''
              } px-[2px]`}
              onClick={getMoreAcorns}>
              {divDecimalsStrShow(playerInfo?.totalAcorns, playerInfo?.acornsDecimals)}
            </span>
            <Tooltip
              title={
                <div className="px-[24px] py-[16px]">
                  {allAcornsTip.map((ele, index) => (
                    <div key={index} className="text-[18px] leading-[28px] mb-[12px]">
                      {ele}
                    </div>
                  ))}
                  <div className="text-right text-[24px] leading-[28px]" onClick={() => setTooltipOpen(false)}>
                    OK
                  </div>
                </div>
              }
              open={tooltipOpen}
              overlayStyle={isMobile ? { maxWidth: 280, borderRadius: 32 } : { maxWidth: 480, borderRadius: 32 }}
              overlayClassName={styles.board__tooltip}
              trigger="click"
              placement="bottomLeft"
              color="#A15A1C">
              <Image
                src={QuestionImage}
                alt="bean"
                className="h-[24px] w-[24px] mr-[14px]"
                onClick={() => setTooltipOpen(true)}
              />
            </Tooltip>
          </div>
          <div className={`${styles['board__acorn']} pr-[38px]`}>
            <Image src={AcornWeeklyImage} alt="bean" className="h-[60px] w-[60px]" />
            <span className={styles['board__acorn__number']}>
              {divDecimalsStrShow(playerInfo?.weeklyAcorns, playerInfo?.acornsDecimals)}
            </span>
          </div>
          <div className={`${styles['board__acorn']} pr-[38px]`} onClick={showLockedAcorns}>
            <Image src={AcornLockedImage} alt="bean" className="h-[60px] w-[60px]" />
            <span className={styles['board__acorn__number']}>
              {divDecimalsStrShow(playerInfo?.lockedAcorns, playerInfo?.acornsDecimals)}
            </span>
          </div>
          <div className={styles['board__feature']} onClick={handleShowLeaderboard}>
            <Image src={RankingImage} alt="bean" className="h-[72px] w-[72px]" />
            <span className={`${styles['board__feature__text']} ml-[50px]`}>Leader Board</span>
          </div>
          <div className={styles['board__feature']} onClick={() => onNftClick && onNftClick()}>
            <Image src={NftImage} alt="bean" className="h-[72px] w-[72px]" />
            <span className={`${styles['board__feature__text']} ${hasNft ? 'ml-[25px]' : 'ml-[12px]'}`}>
              {hasNft ? 'HamsterPass NFT' : 'HamsterPass Giveaway'}
            </span>
          </div>
        </div>
        <GoButton
          playableCount={playableCount}
          dailyPlayableCount={dailyPlayableCount}
          status={status}
          curDiceCount={curDiceCount}
          changeCurDiceCount={changeCurDiceCount}
          go={() => go && go()}
          getChance={getChance}
          purchasedChancesCount={purchasedChancesCount}
        />
      </div>
    );
  }
}

export default React.memo(Board);
