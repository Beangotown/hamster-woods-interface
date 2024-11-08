import { useCallback, useEffect, useRef, useState } from 'react';

import { CheckerboardNode, CheckerboardType, IJumpCallbackParams } from './checkerboard';
import { CheckerboardList } from './checkerboard';
import styles from './index.module.css';

import Checkerboard from './components/Checkerboard';
import Role from './components/Role';
import { CurrentFnAfterApproveType } from 'redux/types/reducerTypes';

import Board from './components/Board';
import GoButton, { Status } from './components/GoButton';
import { ANIMATION_DURATION } from 'constants/animation';
import useGetState from 'redux/state/useGetState';
import RecreationModal, { RecreationModalType } from './components/RecreationModal';
import { useDebounce, useDeepCompareEffect, useEffectOnce, useWindowSize } from 'react-use';
import { GetBeanPassStatus, ShowBeanPassType } from 'components/CommonModal/type';
import GetBeanPassModal from 'components/CommonModal/GetBeanPassModal';
import { useAddress } from 'hooks/useAddress';
import { useRouter } from 'next/navigation';
import {
  fetchBalance,
  fetchBeanPassList,
  fetchPrice,
  getDailyTask,
  getWeeklyTask,
  receiveHamsterPassNFT,
} from 'api/request';
import useWebLogin from 'hooks/useWebLogin';
import showMessage from 'utils/setGlobalComponentsInfo';
import BoardLeft from './components/BoardLeft';
import {
  setCurBeanPass,
  setPlayerInfo,
  setIsManagerReadOnly,
  setCurrentFnAfterApprove,
  setIsManagerReadOnlyIsExecuteEnd,
} from 'redux/reducer/info';
import { IBalance, IBeanPassListItem, IContractError, WalletType } from 'types';
import ShowNFTModal from 'components/CommonModal/ShowNFTModal';
import { dispatch, store } from 'redux/store';
import { TargetErrorType, formatErrorMsg } from 'utils/formattError';
import { sleep } from 'utils/common';
import { setChessboardResetStart, setChessboardTotalStep, setCurChessboardNode } from 'redux/reducer/chessboardData';
import { getTxResultRetry } from 'utils/getTxResult';
import { ChainId } from '@portkey/types';
import { getList } from './utils/getList';
import BoardRight from './components/BoardRight';
import { SECONDS_60 } from 'constants/time';
import { DEFAULT_SYMBOL, RoleImg } from 'constants/role';
import { getBeanPassModalType } from './utils/getBeanPassModalType';
import { setNoticeModal } from 'redux/reducer/noticeModal';
import GlobalCom from './components/GlobalCom';
import CheckerboardBottom from './components/CheckerboardBottom';
import play from './utils/play';
import GetChanceModal from 'components/GetChanceModal';
import CountDownModal from 'components/CountDownModal';
import GetMoreACORNSModal from 'components/CommonModal/GetMoreACORNSModal';
import LockedAcornsModal from 'components/LockedAcornsModal';
import PurchaseNoticeModal, { PurchaseNoticeEnum } from 'components/PurchaseNoticeModal';
import { PurchaseChance } from 'contract/bingo';
import contractRequest from 'contract/contractRequest';
import { ACORNS_TOKEN } from 'constants/index';
import { addPrefixSuffix } from 'utils/addressFormatting';
import { checkerboardData } from 'constants/checkerboardData';
import DepositModal from 'components/Deposit';
import { message } from 'antd';
import { getChainInfo, handleErrorMessage, did, TelegramPlatform } from '@portkey/did-ui-react';
import { useQueryAuthToken } from 'hooks/authToken';
import LoadingModal from 'components/LoadingModal';
import { useLoadingCountdown } from 'hooks/useCountDown';
import GuardianModal from 'components/Login/GuardianModal';
import ContractRequest from 'contract/contractRequest';
import { EE } from 'utils/event';
import useOpenGuardianApprove from 'hooks/useOpenGuardianApprove';
import { getCaContractBySideChain } from 'utils/clearManagerReadonlyStatus';

export default function Game() {
  useEffect(() => {
    console.log('wfs render Game page', new Date(), isLogin, isOnChainLogin);
  }, []);
  const [translate, setTranslate] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  const { width, height } = useWindowSize();
  const address = useAddress();
  const router = useRouter();
  const { initializeContract, updatePlayerInformation, syncAccountInfo } = useWebLogin({});
  const { getETransferAuthTokenFromApi } = useQueryAuthToken();

  const {
    isMobile,
    isLogin,
    isOnChainLogin,
    playerInfo,
    walletType,
    walletInfo,
    configInfo,
    // chessBoardInfo: checkerboardData,
    resetStart: chessboardResetStart,
    chessboardTotalStep,
    curChessboardNode,
    needSync,
    checkerboardCounts,
    curBeanPass,
  } = useGetState();
  // console.log('wfs render Game page out', new Date(), isLogin, isOnChainLogin);
  const { getETransferAuthToken } = useQueryAuthToken();

  const [beanPassInfoDto, setBeanPassInfoDto] = useState<IBeanPassListItem | undefined>(curBeanPass);

  const firstNode = checkerboardData![5][4];
  const firstNodePosition: [number, number] = [5, 4];
  const linkedList = useRef<CheckerboardList>();

  const currentNodeRef = useRef<CheckerboardNode>();
  const checkerboardContainerRef = useRef<HTMLDivElement>(null);
  const [checkerboardContainerWidth, setCheckerboardContainerWidth] = useState<number>();
  const [score, setScore] = useState<number>(0);

  const [open, setOpen] = useState<boolean>(false);
  const [diceType, setDiceType] = useState<RecreationModalType>(RecreationModalType.LOADING);
  const [treasureOpen, setTreasureOpen] = useState<boolean>(false);

  const [playableCount, setPlayableCount] = useState<number>(0);
  const [sumScore] = useState<number>(configInfo!.sumScore);
  const [hasNft, setHasNft] = useState<boolean>(false);
  const [resetStart, setResetStart] = useState<boolean>(true);
  const [totalStep, setTotalStep] = useState<number>(0);
  const [step, setStep] = useState<number>(0);

  const [goLoading, setGoLoading] = useState<boolean>(false);
  const [moving, setMoving] = useState<boolean>(false);
  const [goStatus, setGoStatus] = useState<Status>(Status.DISABLED);
  const [showAdd, setShowAdd] = useState<boolean>(false);

  const [beanPassModalVisible, setBeanPassModalVisible] = useState(false);

  const [beanPassModalType, setBeanPassModalType] = useState<GetBeanPassStatus>(GetBeanPassStatus.Abled);

  const [depositVisible, setDepositVisible] = useState(false);

  const [lockedAcornsVisible, setLockedAcornsVisible] = useState(false);

  const [purchaseNoticeVisible, setPurchaseNoticeVisible] = useState(false);
  const purchaseNoticeTypeRef = useRef(PurchaseNoticeEnum.hop);

  const [isShowNFT, setIsShowNFT] = useState(false);
  const [nftModalType, setNFTModalType] = useState<ShowBeanPassType>(ShowBeanPassType.Display);

  const [opacity, setOpacity] = useState<number>(0);
  const [roleAnimationDuration, setRoleAnimationDuration] = useState<number>(0);

  const [countDownModalOpen, setCountDownModalOpen] = useState(false);

  const [curDiceCount, setCurDiceCount] = useState<number>(1);
  const [diceNumbers, setDiceNumbers] = useState<number[]>([]);

  const [getChanceModalVisible, setGetChanceModalVisible] = useState(false);

  const [acornsInUsd, setAcornsInUsd] = useState(0.1);
  const [elfInUsd, setElfInUsd] = useState(0.35);
  const [assetBalance, setAssetBalance] = useState<IBalance[]>([]);

  const [syncLoading, setSyncLoading] = useState(false);
  useLoadingCountdown();
  const translateRef = useRef<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  const { openGuardianApprove } = useOpenGuardianApprove();

  const updateStep = () => {
    store.dispatch(
      setPlayerInfo({
        ...playerInfo,
        playableCount: playerInfo?.playableCount && playerInfo?.playableCount > 0 ? playerInfo.playableCount - 1 : 0,
      }),
    );
  };

  const updateTotalStep = (totalStep: number) => {
    store.dispatch(setChessboardTotalStep(totalStep));
    setTotalStep(totalStep);
  };

  const updatePosition = ({ x, y, state, currentNode }: IJumpCallbackParams) => {
    setTranslate({
      x: x,
      y: y,
    });
    if (!state) {
      const timer = setTimeout(() => {
        setGoLoading(false);
        setMoving(false);
        clearTimeout(timer);
        if (currentNode) {
          currentNodeRef.current = currentNode;
          store.dispatch(setCurChessboardNode(currentNode));
          if (currentNode.info.info.type === CheckerboardType.TREASURE) {
            setTreasureOpen(true);
          } else {
            updatePlayerInformation(address);
            setShowAdd(true);
          }
        }
      }, ANIMATION_DURATION);
    }
  };

  const jump = (step: number) => {
    if (linkedList.current) {
      const next = linkedList.current.jump({
        step,
        // animation: animationRef.current!,
        baseWidth: translateRef.current.x,
        baseHeight: translateRef.current.y,
      });
      next(({ x, y, state, currentNode }) =>
        updatePosition({
          x,
          y,
          state,
          currentNode,
        }),
      );
    }
  };

  const hideAdd = () => {
    setShowAdd(false);
  };

  const resetPosition = () => {
    setTranslate({
      x: ((currentNodeRef.current?.info.column ?? 4) - 4) * translateRef.current.x,
      y: ((currentNodeRef.current?.info.row ?? 5) - 5) * translateRef.current.y,
    });
  };

  const initCheckerboard = useCallback(() => {
    resetPosition();
    setResetStart(chessboardResetStart);
    setTotalStep(chessboardTotalStep);
    store.dispatch(setChessboardResetStart(chessboardResetStart));
    store.dispatch(setChessboardTotalStep(chessboardTotalStep));
    // animationRef.current?.pause();
    translateRef.current = {
      x: document.getElementById('animationId')?.clientWidth || 0,
      y: document.getElementById('animationId')?.clientHeight || 0,
    };
    linkedList.current = new CheckerboardList({
      baseWidth: translateRef.current.x,
      baseHeight: translateRef.current.y,
      animationDuration: ANIMATION_DURATION,
    });

    if (curChessboardNode) {
      linkedList.current.updateCurrentNode(curChessboardNode);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    getList(firstNode, firstNodePosition, checkerboardData!, linkedList, firstNodePosition);
  }, [chessboardResetStart, chessboardTotalStep, curChessboardNode, firstNode, firstNodePosition]);

  const updateCheckerboard = () => {
    setRoleAnimationDuration(0);
    translateRef.current = {
      x: document.getElementById('animationId')?.clientWidth || 0,
      y: document.getElementById('animationId')?.clientHeight || 0,
    };
    resetPosition();
    linkedList.current?.resize(translateRef.current.x, translateRef.current.y);
  };
  const windowChange = () => {
    if (checkerboardContainerRef) {
      setCheckerboardContainerWidth(checkerboardContainerRef.current?.clientWidth);
    }
  };
  useDebounce(windowChange, 500, [width, height]);
  useEffect(() => {
    updateCheckerboard();
  }, [checkerboardContainerWidth]);

  const updateAssetBalance = useCallback(async () => {
    if (!address) return;
    fetchBalance({ caAddress: addPrefixSuffix(address) }).then((res) => {
      setAssetBalance(res);
    });
  }, [address]);

  const updatePrice = useCallback(async () => {
    fetchPrice().then((res) => {
      setAcornsInUsd(res.acornsInUsd);
      setElfInUsd(res.elfInUsd);
    });
  }, []);

  const getChance = useCallback(
    async (needCheck = true) => {
      console.log('wfs----LoadingModal---getChance');
      if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
        return setSyncLoading(true);
      }
      if (needCheck && openGuardianApprove()) {
        store.dispatch(setCurrentFnAfterApprove(CurrentFnAfterApproveType.GET_CHANCE));
        return;
      }
      if (!playerInfo?.weeklyPurchasedChancesCount) {
        purchaseNoticeTypeRef.current = PurchaseNoticeEnum.getChance;
        setPurchaseNoticeVisible(true);
        return;
      }
      console.log('wfs----LoadingModal---getChance2');
      updatePrice();
      updateAssetBalance();
      setGetChanceModalVisible(true);
    },
    [
      isOnChainLogin,
      needSync,
      openGuardianApprove,
      playerInfo?.weeklyPurchasedChancesCount,
      updateAssetBalance,
      updatePrice,
      walletType,
    ],
  );

  const handlePurchase = useCallback(
    async (n: number, chancePrice: number) => {
      try {
        showMessage.loading();
        const isApproved = await contractRequest.get().checkAllowanceAndApprove({
          approveTargetAddress: configInfo?.beanGoTownContractAddress ?? '',
          amount: n * chancePrice,
          symbol: ACORNS_TOKEN.symbol,
        });
        if (!isApproved) return;
        await PurchaseChance({ value: n });
        showMessage.success('Buy $ACORNS Success');
        updatePlayerInformation(address);
        setGetChanceModalVisible(false);
      } catch (error) {
        console.error('===PurchaseChance error', error);
        showMessage.error('Buy $ACORNS Failed');
      } finally {
        showMessage.hideLoading();
      }
    },
    [address, configInfo?.beanGoTownContractAddress, updatePlayerInformation],
  );

  const go = async (needCheck = true) => {
    console.log('wfs----LoadingModal--go', isOnChainLogin, needCheck, needSync);
    if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
      return setSyncLoading(true);
    }
    // if (isManagerReadOnly && guardianListForFirstNeed?.length === 0 && walletType === WalletType.portkey) {
    //   EE.emit('SET_GUARDIAN_APPROVAL_MODAL', true);
    //   return;
    // }
    if (needCheck && openGuardianApprove()) {
      store.dispatch(setCurrentFnAfterApprove(CurrentFnAfterApproveType.GO));
      return;
    }
    if (goStatus !== Status.NONE) {
      if (!hasNft) {
        onNftClick();
        return;
      }
      return;
    }
    if (hasNft && playableCount === 0 && playerInfo?.purchasedChancesCount === 0) {
      if (!playerInfo?.weeklyPurchasedChancesCount) {
        purchaseNoticeTypeRef.current = PurchaseNoticeEnum.hop;
        setPurchaseNoticeVisible(true);
        return;
      }
      setCountDownModalOpen(true);
      return;
    }
    try {
      setGoLoading(true);
      setDiceType(RecreationModalType.LOADING);
      setOpen(true);
      const bingoRes = await play({
        resetStart,
        diceCount: curDiceCount,
      });
      // await clear()
      updateStep();
      setResetStart(false);
      store.dispatch(setChessboardResetStart(false));
      if (bingoRes) {
        const bingoStep = bingoRes.gridNum;
        if (bingoRes.startGridNum !== totalStep) {
          const stepDifference = (bingoRes.startGridNum + checkerboardCounts - totalStep) % checkerboardCounts;
          for (let index = 0; index < stepDifference; index++) {
            currentNodeRef.current = currentNodeRef.current?.next || linkedList.current?.head || undefined;
          }
          linkedList.current?.updateCurrentNode(currentNodeRef.current || null);
          updateCheckerboard();
        }
        updateTotalStep(bingoRes.endGridNum);
        setRoleAnimationDuration(ANIMATION_DURATION);
        setScore(bingoRes.score);
        setStep(bingoStep);
        setDiceNumbers(bingoRes.diceNumbers);
        setDiceType(RecreationModalType.DICE);
      }
    } catch (error) {
      console.error('=====error', error);
      const resError = error as IContractError;
      showMessage.error(formatErrorMsg(resError)?.errorMessage?.message);
      setMoving(false);
      setOpen(false);
      updatePlayerInformation(address);
    }
    setGoLoading(false);
  };

  const doubleClaimCallback = () => {
    dispatch(
      setNoticeModal({
        onCancel: () => {
          dispatch(
            setNoticeModal({
              open: false,
            }),
          );
          setBeanPassModalType(GetBeanPassStatus.Notfound);
          setBeanPassModalVisible(true);
        },
      }),
    );
  };

  const checkBeanPassStatus = useCallback(async () => {
    if (address) {
      showMessage.loading(TargetErrorType.Error7);
      const res = await getBeanPassModalType({ address, doubleClaimCallback, reTryCounts: 4 });
      if (res) {
        setBeanPassModalType(res);
        setBeanPassModalVisible(true);
      }
    }
  }, [address]);

  const handleConfirm = async () => {
    if (beanPassModalType === GetBeanPassStatus.Abled) {
      showMessage.loading();
      const getNFTRes = await receiveHamsterPassNFT({
        caAddress: address,
        domain: window.location.hostname,
      });
      const { claimable, reason, transactionId, hamsterPassInfo } = getNFTRes;
      if (!claimable) {
        showMessage.error(reason);
        showMessage.hideLoading();
        return;
      }
      setBeanPassModalVisible(false);
      setBeanPassInfoDto({ ...hamsterPassInfo, owned: true, usingBeanPass: true });
      setNFTModalType(ShowBeanPassType.Success);

      await sleep(configInfo?.stepUpdateDelay || 3000);
      try {
        await getTxResultRetry({
          TransactionId: transactionId,
          chainId: configInfo?.curChain as ChainId,
          rpcUrl: configInfo!.rpcUrl,
          rePendingEnd: new Date().getTime() + SECONDS_60,
          reNotexistedCount: 5,
        });
        updatePlayerInformation(address);
        setBeanPassInfoDto({ ...hamsterPassInfo, owned: true, usingBeanPass: true });
        setIsShowNFT(true);
        dispatch(
          setCurBeanPass({
            ...hamsterPassInfo,
            owned: true,
            usingBeanPass: true,
          }),
        );
      } catch (error) {
        /* empty */
      }

      showMessage.hideLoading();
    } else if (beanPassModalType === GetBeanPassStatus.Recharge) {
      if (walletType === WalletType.discover || walletType === WalletType.unknown) {
        return;
      }
      router.push('/asset');
    } else {
      setBeanPassModalVisible(false);
    }
  };

  const initContractAndCheckBeanPass = useCallback(async () => {
    await initializeContract();
  }, [initializeContract]);

  const showDepositModal = useCallback(async () => {
    try {
      if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
        return setSyncLoading(true);
      }
      if (openGuardianApprove()) {
        return;
      }
      await getETransferAuthToken();
      setDepositVisible(true);
    } catch (error) {
      message.error(handleErrorMessage(error, 'Get etransfer auth token error'));
    }
  }, [getETransferAuthToken, isOnChainLogin, needSync, openGuardianApprove, walletType]);

  const handleHasNft = useCallback(
    (hasNft: boolean) => {
      if (hasNft) {
        setHasNft(true);
        setOpacity(1);
        showMessage.hideLoading();
      } else {
        setHasNft(false);
        checkBeanPassStatus();
      }
    },
    [checkBeanPassStatus],
  );

  useEffect(() => {
    if ((isLogin || isOnChainLogin) && needSync) {
      syncAccountInfo();
    }
  }, [isLogin, isOnChainLogin, needSync, syncAccountInfo]);

  useEffect(() => {
    console.log(
      'wfs----LoadingModal1',
      isLogin,
      'isOnChainLogin',
      isOnChainLogin,
      'walletType',
      walletType,
      'walletInfo',
      walletInfo,
      // 'needSync',
      // needSync,
    );
    if (!isLogin && !isOnChainLogin) {
      router.push('/login');
    } else {
      if (walletType !== WalletType.unknown && walletInfo) {
        initContractAndCheckBeanPass();
      }
    }
  }, [initContractAndCheckBeanPass, isLogin, isOnChainLogin, router, walletInfo, walletType]);

  useEffect(() => {
    initCheckerboard();
  }, [hasNft, checkerboardData]);

  useEffect(() => {
    if (!isOnChainLogin && walletType === WalletType.portkey) {
      return;
    }
    showMessage.loading();
    getETransferAuthTokenFromApi();
    setResetStart(chessboardResetStart);
    setTotalStep(chessboardTotalStep);
    currentNodeRef.current = curChessboardNode;
    if (curChessboardNode) {
      setOpacity(0);
      updateCheckerboard();
      setTimeout(() => {
        setOpacity(1);
      }, 25);
    }
    showMessage.hideLoading();
  }, [isOnChainLogin]);

  useEffect(() => {
    updateAssetBalance();
  }, [updateAssetBalance]);

  // useEffect(() => {
  //   if (address) {
  //     getModalInfo({
  //       isHalloween: configInfo?.isHalloween,
  //       caAddress: address,
  //     });
  //   }
  // }, [address]);

  useDeepCompareEffect(() => {
    setPlayableCount(playerInfo?.playableCount || 0);
    if (!hasNft || !sumScore || moving) {
      return setGoStatus(Status.DISABLED);
    }
    if (goLoading) {
      setGoStatus(Status.LOADING);
      return;
    }
    setGoStatus(Status.NONE);
    // if (playerInfo?.playableCount && playerInfo?.playableCount > 0) {
    //   setGoStatus(Status.NONE);
    // } else {
    //   setGoStatus(Status.DISABLED);
    // }
  }, [hasNft, moving, goLoading, playerInfo]);

  const onShowNFTModalCancel = () => {
    if (nftModalType === ShowBeanPassType.Success) {
      handleHasNft(true);
    }
    setIsShowNFT(false);
  };

  const onNftClick = async () => {
    if (hasNft) {
      setNFTModalType(ShowBeanPassType.Display);
      setIsShowNFT(true);
    } else {
      showMessage.loading();
      checkBeanPassStatus();
    }
  };

  const diceModalOnClose = () => {
    setOpen(false);
    setMoving(true);
    setShowAdd(false);
    jump(step);
  };

  const recreationModalOnClose = () => {
    updatePlayerInformation(address);
    setTreasureOpen(false);
  };

  const changeCurDiceCount = (num: number) => {
    setCurDiceCount(num);
  };

  const getHamsterPass = useCallback(async () => {
    if (!address) return;
    const beanPassList = await fetchBeanPassList({ caAddress: address });
    setBeanPassInfoDto(beanPassList?.[0]);
  }, [address]);

  useEffect(() => {
    if (playerInfo?.hamsterPassOwned !== undefined) {
      handleHasNft(playerInfo?.hamsterPassOwned || false);
      if (playerInfo?.hamsterPassOwned) {
        getHamsterPass();
      }
    }
  }, [playerInfo?.hamsterPassOwned, address, handleHasNft, getHamsterPass]);

  useEffect(() => {
    if (!isOnChainLogin) {
      return;
    }
    async function getIsManagerReadOnly() {
      const caIns = await getCaContractBySideChain();
      console.log(
        'wfs----LoadingModal---chainInfo.caContractAddress----1111',
        caIns.address,
        walletInfo?.portkeyInfo?.caInfo?.caHash,
        walletInfo?.portkeyInfo?.walletInfo?.address,
        did.didWallet.managementAccount?.address,
        isOnChainLogin,
      );
      try {
        const rs = await caIns.callViewMethod('IsManagerReadOnly', {
          caHash: walletInfo?.portkeyInfo?.caInfo?.caHash,
          manager: walletInfo?.portkeyInfo?.walletInfo?.address,
        });
        console.log('wfs----LoadingModal--getIsManagerReadOnly', rs);
        store.dispatch(setIsManagerReadOnly(!!rs?.data));
        store.dispatch(setIsManagerReadOnlyIsExecuteEnd(true));
        showMessage.hideLoading();
      } catch (e) {
        console.log('wfs----LoadingModal--err', e);
      }
    }
    getIsManagerReadOnly();
  }, [isOnChainLogin, walletInfo?.portkeyInfo?.caInfo?.caHash, walletInfo?.portkeyInfo?.walletInfo?.address]);

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${
            require(isMobile ? 'assets/images/bg/playground-mobile.png' : 'assets/images/bg/playground-pc.png').default
              .src
          })`,
        }}
        className={`${styles.game} cursor-custom relative z-[1] ${isMobile && 'flex-col'}`}>
        {!isMobile && <BoardLeft />}
        <div
          className={`${styles['game__content']} flex overflow-hidden ${
            isMobile ? 'w-full flex-1' : 'h-full w-[40%] min-w-[500Px] max-w-[784Px]'
          }`}>
          {isMobile && <Board hasNft={hasNft} onNftClick={onNftClick} />}
          <div
            ref={checkerboardContainerRef}
            className={`w-full overflow-y-auto overflow-x-hidden ${styles.scrollbar}`}>
            <div className={`relative flex-1 pl-[16px] ${isMobile ? 'pt-[41px]' : 'pt-[80px]'}`}>
              <div className="relative z-[30]">
                <Role
                  id="animationId"
                  width={`calc(100% / ${checkerboardData?.[0]?.length})`}
                  translate={translate}
                  bean={score}
                  opacity={beanPassInfoDto?.symbol ? opacity : 0}
                  position={{
                    x: currentNodeRef.current?.info.row,
                    y: currentNodeRef.current?.info.column,
                  }}
                  animationDuration={roleAnimationDuration}
                  showAdd={showAdd}
                  hideAdd={hideAdd}>
                  {/* <Lottie lottieRef={animationRef} animationData={dataAnimation} /> */}
                  <img className="w-full h-full" src={RoleImg[beanPassInfoDto?.symbol || DEFAULT_SYMBOL]} alt="role" />
                </Role>

                {checkerboardData?.map((row, index) => {
                  return (
                    <div key={index} className="flex">
                      {row.map((column) => {
                        return (
                          <div
                            key={column.id}
                            style={{
                              width: `calc(100% / ${row.length})`,
                            }}>
                            <Checkerboard value={column} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <CheckerboardBottom />
            </div>
          </div>
        </div>
        {!isMobile && (
          <BoardRight>
            <Board
              hasNft={hasNft}
              onNftClick={onNftClick}
              playableCount={playableCount}
              dailyPlayableCount={hasNft ? playerInfo?.dailyPlayableCount : 0}
              status={goStatus}
              curDiceCount={curDiceCount}
              changeCurDiceCount={changeCurDiceCount}
              go={go}
              getChance={getChance}
              getMoreAcorns={showDepositModal}
              showLockedAcorns={() => setLockedAcornsVisible(true)}
              purchasedChancesCount={playerInfo?.purchasedChancesCount}
            />
          </BoardRight>
        )}

        {isMobile && (
          <GoButton
            playableCount={playableCount}
            dailyPlayableCount={hasNft ? playerInfo?.dailyPlayableCount : 0}
            status={goStatus}
            curDiceCount={curDiceCount}
            changeCurDiceCount={changeCurDiceCount}
            go={go}
            getChance={getChance}
            purchasedChancesCount={playerInfo?.purchasedChancesCount}
          />
        )}

        <RecreationModal
          open={open}
          onClose={diceModalOnClose}
          diceNumbers={diceNumbers}
          type={diceType}
          step={step}
          curDiceCount={curDiceCount}
        />
        <RecreationModal
          open={treasureOpen}
          onClose={recreationModalOnClose}
          type={RecreationModalType.TREASURE}
          step={step}
          bean={score}
        />
        <GetBeanPassModal
          type={beanPassModalType}
          open={beanPassModalVisible}
          onCancel={() => setBeanPassModalVisible(false)}
          onConfirm={handleConfirm}
        />
        {getChanceModalVisible && (
          <GetChanceModal
            acornsInUsd={acornsInUsd}
            elfInUsd={elfInUsd}
            assetBalance={assetBalance}
            open={getChanceModalVisible}
            onCancel={() => setGetChanceModalVisible(false)}
            onConfirm={handlePurchase}
            updateAssetBalance={updateAssetBalance}
          />
        )}
        <LockedAcornsModal open={lockedAcornsVisible} onCancel={() => setLockedAcornsVisible(false)} />

        <DepositModal open={depositVisible} onCancel={() => setDepositVisible(false)} />

        <PurchaseNoticeModal
          open={purchaseNoticeVisible}
          onConfirm={() => setPurchaseNoticeVisible(false)}
          type={purchaseNoticeTypeRef.current}
        />
        <ShowNFTModal
          open={isShowNFT}
          beanPassItem={beanPassInfoDto}
          onCancel={onShowNFTModalCancel}
          type={nftModalType}
        />
        <CountDownModal
          open={countDownModalOpen}
          btnText="Get More Hopping Chances"
          onCancel={() => setCountDownModalOpen(false)}
          onConfirm={() => {
            setCountDownModalOpen(false);
            updateAssetBalance();
            updatePrice();
            setGetChanceModalVisible(true);
          }}
        />
        <LoadingModal open={syncLoading} onCancel={() => setSyncLoading(false)} />
      </div>

      <GlobalCom getChance={getChance} />

      <GuardianModal
        networkType={configInfo?.network}
        caHash={walletInfo?.portkeyInfo?.caInfo?.caHash}
        originChainId={walletInfo?.portkeyInfo?.chainId}
        targetChainId={configInfo?.curChain ?? ''}
        go={go}
        getChance={getChance}
      />
    </>
  );
}
