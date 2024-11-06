import { Input, message, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import { useIsMobile } from 'redux/selector/mobile';
import CommonBtn from 'components/CommonBtn';
import CustomModal, { ICustomModalProps } from 'components/CustomModal';
import NeatIcon from 'assets/images/neat.png';
import PlusIcon from 'assets/images/plus.png';
import MinusIcon from 'assets/images/minus.png';
import ArrowIcon from 'assets/images/arrow.png';
import AddIcon from 'assets/images/add.png';
import ELFIcon from 'assets/images/elf.png';
import { isValidNumber } from 'utils/common';
import { useSelector } from 'redux/store';
import { IBalance, WalletType } from 'types';
import { ZERO, divDecimals, divDecimalsStrShow, formatAmountUSDShow } from 'utils/calculate';
import { ACORNS_TOKEN } from 'constants/index';
import useGetState from 'redux/state/useGetState';
import CommonDisabledBtn from 'components/CommonDisabledBtn';
import styles from './style.module.css';
import { useRouter } from 'next/navigation';
import { useQueryAuthToken } from 'hooks/authToken';
import QuestionImage from 'assets/images/recreation/question.png';
import DepositModal from 'components/Deposit';
import { handleErrorMessage } from '@portkey/did-ui-react';
import AwakenSwapModal from 'components/AwakenSwap';
import { useAddress } from 'hooks/useAddress';
import useWebLogin from 'hooks/useWebLogin';
import { useBalance } from 'hooks/useBalance';
import LoadingModal from 'components/LoadingModal';
import useOpenGuardianApprove from 'hooks/useOpenGuardianApprove';

export type GetChanceModalPropsType = {
  onConfirm?: (n: number, chancePrice: number) => void;
  acornsInUsd: number;
  elfInUsd: number;
  assetBalance: IBalance[];
  updateAssetBalance?: () => void;
};

export default function GetChanceModal({
  title = 'Get More Hopping Chances',
  onCancel,
  closable = true,
  acornsInUsd,
  elfInUsd,
  assetBalance,
  onConfirm,
  updateAssetBalance,
  ...params
}: ICustomModalProps & GetChanceModalPropsType) {
  const { serverConfigInfo, configInfo } = useSelector((state) => state);
  const { updatePlayerInformation } = useWebLogin({});
  const address = useAddress();
  const isMobile = useIsMobile();
  const [inputVal, setInputVal] = useState(1);
  const [expand, setExpand] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { playerInfo, isOnChainLogin, walletType, needSync } = useGetState();
  const [errMsgTip, setErrMsgTip] = useState('');
  const [swapOpen, setSwapOpen] = useState(false);
  const [notEnoughAcorns, setNotEnoughAcorns] = useState(false);
  const router = useRouter();
  const { getETransferAuthToken } = useQueryAuthToken();
  const getBalance = useBalance();
  const [syncLoading, setSyncLoading] = useState(false);
  const { openGuardianApprove } = useOpenGuardianApprove();

  const chancePrice = useMemo(
    () => serverConfigInfo.serverConfigInfo?.chancePrice || 1,
    [serverConfigInfo.serverConfigInfo?.chancePrice],
  );
  const fee = useMemo(
    () => serverConfigInfo.serverConfigInfo?.buyChanceTransactionFee || 0,
    [serverConfigInfo.serverConfigInfo?.buyChanceTransactionFee],
  );
  const acornsToken = useMemo(() => assetBalance?.find((item) => item.symbol === ACORNS_TOKEN.symbol), [assetBalance]);
  const ElfToken = useMemo(() => assetBalance?.find((item) => item.symbol === 'ELF'), [assetBalance]);
  const [acornsBalance, setAcornsBalance] = useState(acornsToken?.balance);
  const [ELFBalance, setELFBalance] = useState(ElfToken?.balance);
  const showSwap = useMemo(() => ZERO.plus(ElfToken?.balance ?? 0).gt(ZERO), [ElfToken?.balance]);

  const updateBalance = useCallback(async () => {
    const [_ELF, _ACORNS] = await Promise.all([getBalance('ELF'), getBalance('ACORNS')]);
    typeof _ACORNS !== 'undefined' && setAcornsBalance(_ACORNS);
    typeof _ELF !== 'undefined' && setELFBalance(_ELF);
  }, [getBalance]);

  useEffect(() => {
    updateBalance();
  }, [updateBalance]);

  const handleInput = useCallback((value: string) => {
    if (!value) {
      setInputVal(0);
      return;
    }
    if (isValidNumber(value)) {
      setInputVal(Number(value));
    }
  }, []);

  const handleClose = useCallback(() => {
    setInputVal(1);
    onCancel?.();
  }, [onCancel]);

  const onEnterTransfer = useCallback(async () => {
    try {
      if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
        return setSyncLoading(true);
      }
      if (openGuardianApprove()) {
        return;
      }
      await getETransferAuthToken();
      setShowDepositModal(true);
    } catch (error) {
      message.error(handleErrorMessage(error, 'Get etransfer auth token error'));
    }
  }, [getETransferAuthToken, isOnChainLogin, needSync, openGuardianApprove, walletType]);

  const errorMessageTipDom = useCallback(() => {
    if (!errMsgTip)
      return (
        <>
          {`You can `}
          <span className="underline font-black text-[#3989FF]" onClick={onEnterTransfer}>
            buy $ACORNS
          </span>
          {` with $USDT from other chains.`}
        </>
      );

    if (errMsgTip && notEnoughAcorns)
      return (
        <>
          {`Insufficient $ACORNS. You can use $USDT from other chains to `}
          <span className="underline font-black text-[#3989FF]" onClick={onEnterTransfer}>
            buy $ACORNS
          </span>
        </>
      );

    return <span className="text-[#FF4D4D]">{errMsgTip}</span>;
  }, [errMsgTip, notEnoughAcorns, onEnterTransfer]);

  const handleCheckPurchase = useCallback(() => {
    if (!inputVal) {
      setErrMsgTip('Please input valid number.');
      return false;
    }

    const acornsToken = assetBalance?.find((item) => item.symbol === ACORNS_TOKEN.symbol);
    if (
      !acornsBalance ||
      ZERO.plus(divDecimals(acornsBalance, acornsToken?.decimals)).lt(ZERO.plus(inputVal).times(chancePrice))
    ) {
      setErrMsgTip('Acorns is not enough');
      setNotEnoughAcorns(true);
      return false;
    }

    if (ZERO.plus(inputVal).gt(ZERO.plus(playerInfo?.weeklyPurchasedChancesCount ?? 0))) {
      setErrMsgTip(
        `Purchase limit exceeded. Please try purchasing no more than ${playerInfo?.weeklyPurchasedChancesCount}.`,
      );
      return false;
    }
    return true;
  }, [acornsBalance, assetBalance, chancePrice, inputVal, playerInfo?.weeklyPurchasedChancesCount]);

  const handleMinus = useCallback(() => {
    if (inputVal < 2) return;
    setInputVal((pre) => pre - 1);
  }, [inputVal]);

  const handlePlus = useCallback(() => {
    if (inputVal >= (playerInfo?.weeklyPurchasedChancesCount ?? 0)) return;
    setInputVal((pre) => pre + 1);
  }, [inputVal, playerInfo?.weeklyPurchasedChancesCount]);

  const handleConfirm = useCallback(() => {
    if (errMsgTip) return;
    if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
      return setSyncLoading(true);
    }
    if (openGuardianApprove()) {
      return;
    }
    if (!handleCheckPurchase()) return;
    onConfirm?.(inputVal, chancePrice);
  }, [
    chancePrice,
    errMsgTip,
    handleCheckPurchase,
    inputVal,
    isOnChainLogin,
    needSync,
    onConfirm,
    openGuardianApprove,
    walletType,
  ]);

  const handleCancel = useCallback(() => {
    setInputVal(1);
    setExpand(false);
    setErrMsgTip('');
    setNotEnoughAcorns(false);
    handleClose?.();
  }, [handleClose]);

  useEffect(() => {
    setErrMsgTip('');
    setNotEnoughAcorns(false);
    if (inputVal > 1) handleCheckPurchase();
  }, [handleCheckPurchase, inputVal]);

  return (
    <CustomModal
      className={`${isMobile ? '!w-[358px]' : '!w-[750px]'} ${styles.getChanceModal}`}
      onCancel={handleCancel}
      title={title}
      closable={closable}
      centered
      destroyOnClose
      {...params}>
      <div className={`${isMobile ? 'max-h-[50vh] px-[16px]' : 'h-[41rem] px-[32px]'} overflow-auto`}>
        <div className={` ${isMobile ? 'space-y-[18px] ' : 'space-y-[28px] '}`}>
          <div className={`flex justify-center items-center flex-wrap  ${isMobile ? 'text-[16px]' : 'text-[20px]'} `}>
            Exchange
            <span className="font-bold flex items-center space-x-[6px] mx-[10px]">
              <span>{((inputVal || 1) * chancePrice)?.toLocaleString()}</span>
              <Image className="w-[20px] h-[20px]" src={NeatIcon} alt="neat" />
              <span>$ACORNS</span>
            </span>
            for <span className="font-bold mx-[10px]">{inputVal || 1}</span>
            {`hopping ${inputVal > 1 ? 'chances' : 'chance'}`}
          </div>
          <div className="flex items-center justify-center space-x-[16px]">
            <Image
              onClick={handleMinus}
              className={`${inputVal < 2 && 'opacity-30'} ${isMobile ? 'w-[32px] h-[32px]' : 'w-[40px] h-[40px]'}`}
              src={MinusIcon}
              alt="minus"
            />
            <Input
              className={`${
                isMobile ? 'w-[222px] h-[32px]' : 'w-[340px] h-[40px]'
              } text-[24px] rounded-[8px] border-[#A15A1C] hover:border-[#A15A1C] focus:border-[#A15A1C] focus:shadow-none text-[#953D22] text-center font-paytone`}
              value={inputVal}
              onChange={(e) => handleInput(e.target.value)}
              onBlur={handleCheckPurchase}
            />
            <Image
              onClick={handlePlus}
              className={`${inputVal >= (playerInfo?.weeklyPurchasedChancesCount ?? 0) && 'opacity-30'} ${
                isMobile ? 'w-[32px] h-[32px]' : 'w-[40px] h-[40px]'
              }`}
              src={PlusIcon}
              alt="plus"
            />
          </div>
        </div>
        <div className={`${isMobile ? 'text-[10px] leading-[18px]' : 'text-[14px] leading-[24px]'}  text-center`}>
          {errorMessageTipDom()}
        </div>

        {isMobile ? (
          <div className="flex flex-col space-y-[16px] items-center justify-between mt-[12px] w-full text-[14px]">
            <div>You pay</div>
            <div className="w-full flex items-center justify-between font-bold">
              <div className="flex items-center space-x-[8px]">
                <Image className="w-[20px] h-[20px]" src={NeatIcon} alt="neat" />
                <span>{`${(inputVal * chancePrice)?.toLocaleString()} ${ACORNS_TOKEN.symbol}`}</span>
              </div>
              <Image src={AddIcon} alt="add" />
              <div className="flex items-center space-x-[8px]">
                <Image className="w-[20px] h-[20px]" src={ELFIcon} alt="elf" />
                <span>{`${fee} ELF`}</span>
                <Image
                  className={`w-[20px] h-[20px] ${expand && 'rotate-180'}`}
                  onClick={() => setExpand(!expand)}
                  src={ArrowIcon}
                  alt="arrow"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-[40px] text-[20px]">
            <div>You pay</div>
            <div className="flex items-center space-x-[8px] text-right font-bold">
              <div className="flex items-center space-x-[8px]">
                <Image className="w-[20px] h-[20px]" src={NeatIcon} alt="neat" />
                <span>{`${(inputVal * chancePrice)?.toLocaleString()} ${ACORNS_TOKEN.symbol}`}</span>
              </div>
              <Image src={AddIcon} alt="add" />
              <div className="flex items-center space-x-[8px]">
                <Image className="w-[20px] h-[20px]" src={ELFIcon} alt="elf" />
                <span>{`${fee} ELF`}</span>
                <Image
                  className={`w-[20px] h-[20px] ${expand && 'rotate-180'}`}
                  onClick={() => setExpand(!expand)}
                  src={ArrowIcon}
                  alt="arrow"
                />
              </div>
            </div>
          </div>
        )}
        {expand && (
          <div className={`${isMobile ? 'mb-[12px]' : 'mb-[40px]'}`}>
            <div
              className={`flex items-start justify-between mt-[12px] text-[#AE694C] ${
                isMobile ? 'text-[14px] mt-[8px]' : 'text-[16px]'
              }`}>
              <div className="flex items-center">
                Estimated Transaction Fee{' '}
                <Tooltip
                  title={
                    <div
                      className={`${
                        isMobile ? 'px-[10px] py-[6px] text-[12px] leading-[14px]' : 'px-[14px] py-[10px] text-[18px]'
                      }`}>
                      You may be exempt from the transaction fee if you qualify for fee exemption or payment delegation.
                    </div>
                  }
                  overlayStyle={isMobile ? { maxWidth: 350, borderRadius: 18 } : { maxWidth: 480, borderRadius: 32 }}
                  overlayClassName={`${isMobile ? styles.board__tooltip__mobile : styles.board__tooltip}`}
                  trigger="click"
                  placement="top"
                  color="#A15A1C">
                  <Image
                    src={QuestionImage}
                    alt="bean"
                    className={`${isMobile ? 'h-[12px] w-[12px]' : 'h-[16px] w-[16px]'} ml-[4px]`}
                  />
                </Tooltip>
              </div>
              <div className={`text-right flex flex-col ${isMobile ? 'space-y-[8px]' : 'space-y-[12px]'}`}>
                <div className="font-bold">{`${fee} ELF`}</div>
                <div>{`${formatAmountUSDShow(fee * elfInUsd)}`}</div>
              </div>
            </div>
            <div
              className={`flex items-start justify-between mt-[12px] text-[#AE694C] ${
                isMobile ? 'text-[14px] mt-[8px]' : 'text-[16px]'
              }`}>
              <div>Buy Game Chance</div>
              <div className={`text-right flex flex-col  ${isMobile ? 'space-y-[8px]' : 'space-y-[12px]'}`}>
                <div className="font-bold">{`${(inputVal * chancePrice)?.toLocaleString()} ${
                  ACORNS_TOKEN.symbol
                }`}</div>
                <div>{`${formatAmountUSDShow(inputVal * chancePrice * acornsInUsd)}`}</div>
              </div>
            </div>
          </div>
        )}
        {assetBalance?.length ? (
          <div
            className={`flex flex-col bg-[#E8D1AE] rounded-[12px] ${
              isMobile ? 'text-[16px] space-y-[8px] p-[8px]' : 'text-[20px] space-y-[24px] p-[16px]'
            }`}>
            <div className="flex font-black">Balance</div>
            <div className="flex justify-between items-center ">
              <div className="font-bold text-left overflow-hidden flex-1">{`${
                acornsToken?.symbol
              }: ${divDecimalsStrShow(acornsBalance, acornsToken?.decimals)}`}</div>
              <div
                onClick={onEnterTransfer}
                className={`${
                  isMobile ? 'px-[8px] py-[6px] text-[12px]' : 'px-[16px] py-[9px] text-[14px]'
                } flex items-center justify-center rounded-[8px] bg-[#A15A1C] font-black text-[#FFFFFF]`}>
                Buy with $USDT
              </div>
              {showSwap && (
                <div
                  onClick={() => {
                    if ((!isOnChainLogin && walletType === WalletType.portkey) || needSync) {
                      return setSyncLoading(true);
                    }
                    if (openGuardianApprove()) {
                      return;
                    }
                    setSwapOpen(true);
                  }}
                  className={`${
                    isMobile ? 'px-[8px] py-[6px] text-[12px]' : 'px-[16px] py-[9px] text-[14px]'
                  } flex items-center justify-center rounded-[8px] bg-[#A15A1C] font-black text-[#FFFFFF] ml-[8px]`}>
                  Swap
                </div>
              )}
            </div>
            <div className="flex font-bold">{`${ElfToken?.symbol}: ${divDecimalsStrShow(
              ELFBalance,
              ElfToken?.decimals,
            )}`}</div>
          </div>
        ) : null}
        {errMsgTip && !notEnoughAcorns ? (
          <CommonDisabledBtn
            title={notEnoughAcorns ? 'Buy $ACORNS with $USDT' : 'Purchase'}
            onClick={undefined}
            className={`flex justify-center items-center ${
              isMobile
                ? 'text-[20px] leading-[20px] mt-[24px] h-[48px] mb-[16px]'
                : '!text-[32px] !leading-[40px] mt-[40px] !h-[76px] mx-[64px] mb-[32px]'
            }`}
          />
        ) : (
          <CommonBtn
            title={notEnoughAcorns ? 'Buy $ACORNS with $USDT' : 'Purchase'}
            onClick={notEnoughAcorns ? onEnterTransfer : handleConfirm}
            className={`flex justify-center items-center font-paytone ${
              isMobile
                ? 'text-[20px] leading-[20px] mt-[24px] h-[48px] mb-[16px]'
                : '!text-[32px] !leading-[40px] mt-[40px] !h-[76px] mx-[64px] mb-[32px]'
            }`}
          />
        )}
      </div>
      <DepositModal open={showDepositModal} onCancel={() => setShowDepositModal(false)} />
      <AwakenSwapModal
        open={swapOpen}
        selectTokenInSymbol="ELF"
        selectTokenOutSymbol="ACORNS"
        onCancel={() => {
          setSwapOpen(false);
          updatePlayerInformation(address);
          updateBalance();
        }}
      />
      <LoadingModal open={syncLoading} onCancel={() => setSyncLoading(false)} />
    </CustomModal>
  );
}
