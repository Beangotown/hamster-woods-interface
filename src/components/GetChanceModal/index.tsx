import { Input } from 'antd';
import { useCallback, useMemo, useState } from 'react';
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
import { store } from 'redux/store';
import { IBalance } from 'types';
import openPage from 'utils/openPage';
const { serverConfigInfo, configInfo } = store.getState();

export type GetChanceModalPropsType = {
  onConfirm?: (n: number, chancePrice: number) => void;
  acornsInElf: number;
  elfInUsd: number;
  assetBalance: IBalance[];
};

export default function GetChanceModal({
  title = 'Get More Hopping Chances',
  onCancel,
  closable = true,
  acornsInElf,
  elfInUsd,
  assetBalance,
  onConfirm,
  ...params
}: ICustomModalProps & GetChanceModalPropsType) {
  const isMobile = useIsMobile();
  const [inputVal, setInputVal] = useState(1);
  const [expand, setExpand] = useState(false);
  const chancePrice = useMemo(() => serverConfigInfo.serverConfigInfo?.chancePrice || 1, []);
  const fee = useMemo(() => serverConfigInfo.serverConfigInfo?.buyChanceTransactionFee || 0, []);
  const acornsToken = useMemo(() => assetBalance.find((item) => item.symbol === 'ACORNS'), [assetBalance]);
  const ElfToken = useMemo(() => assetBalance.find((item) => item.symbol === 'ELF'), [assetBalance]);

  const handleMinus = useCallback(() => {
    if (inputVal < 2) return;
    setInputVal((pre) => pre - 1);
  }, [inputVal]);
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

  return (
    <CustomModal
      className={`${isMobile ? '!w-[358px]' : '!w-[750px]'}`}
      onCancel={handleClose}
      title={title}
      closable={closable}
      destroyOnClose
      {...params}>
      <div className={`overflow-auto`}>
        <div className="space-y-[28px]">
          <div className="flex justify-center items-center flex-wrap text-[20px]">
            Do you want to pay
            <span className="font-bold flex items-center space-x-[6px] mx-[10px]">
              <span>{chancePrice}</span>
              <Image className="w-[20px] h-[20px]" src={NeatIcon} alt="neat" />
              <span>ACORNS</span>
            </span>
            for <span className="font-bold mx-[10px]">1 number</span>of chances to play
          </div>
          <div className="flex items-center justify-center space-x-[16px]">
            <Image
              onClick={handleMinus}
              className={`${inputVal < 2 && 'opacity-30'} w-[40px] h-[40px]`}
              src={MinusIcon}
              alt="minus"
            />
            <Input
              className={`${
                isMobile ? 'w-[222px]' : 'w-[340px]'
              } h-[40px] text-[24px] rounded-[8px] border-[#A15A1C] hover:border-[#A15A1C] focus:border-[#A15A1C] focus:shadow-none text-[#953D22] text-center font-fonarto`}
              value={inputVal}
              onChange={(e) => handleInput(e.target.value)}
            />
            <Image
              onClick={() => setInputVal((pre) => pre + 1)}
              className="w-[40px] h-[40px]"
              src={PlusIcon}
              alt="plus"
            />
          </div>
        </div>
        {isMobile ? (
          <div className="flex flex-col space-y-[16px] items-center justify-between mt-[24px] w-full text-[14px]">
            <div>You pay</div>
            <div className="w-full flex items-center justify-between font-bold">
              <div className="flex items-center space-x-[8px]">
                <Image className="w-[20px] h-[20px]" src={NeatIcon} alt="neat" />
                <span>{inputVal * chancePrice} ACORNS</span>
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
                <span>{inputVal * chancePrice} ACORNS</span>
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
          <>
            <div
              className={`flex items-start justify-between mt-[12px] text-[#AE694C] ${
                isMobile ? 'text-[14px]' : 'text-[16px]'
              }`}>
              <div>Estimated Transaction Fee</div>
              <div className="text-right flex flex-col space-y-[12px]">
                <div className="font-bold">{`${fee} ELF`}</div>
                <div>{`$ ${fee * elfInUsd}`}</div>
              </div>
            </div>
            <div
              className={`flex items-center justify-between mt-[12px] text-[#AE694C] ${
                isMobile ? 'text-[14px]' : 'text-[16px]'
              }`}>
              <div>Buy Game Chance</div>
              <div className="text-right flex flex-col space-y-[12px]">
                <div className="font-bold">{`${inputVal * chancePrice * acornsInElf} ELF`}</div>
                <div>{`$ ${inputVal * chancePrice * acornsInElf * elfInUsd}`}</div>
              </div>
            </div>
          </>
        )}
        {assetBalance?.length ? (
          <div
            className={`flex flex-col bg-[#E8D1AE] rounded-[12px] ${
              isMobile
                ? 'text-[16px] space-y-[12px] p-[12px] mt-[24px]'
                : 'text-[20px] space-y-[24px] p-[16px] mt-[40px]'
            }`}>
            <div className="flex font-black">balance</div>
            <div className="flex justify-between items-center">
              <div className="font-bold text-left">{`${acornsToken?.symbol}: ${acornsToken?.balance}`}</div>
              <div
                onClick={() => {
                  openPage(`${configInfo?.configInfo?.awakenUrl}/ELF_ACORNS_0.05`);
                }}
                className="flex items-center justify-center px-[16px] py-[9px] rounded-[8px] bg-[#A15A1C] text-[14px] font-black text-[#FFFFFF]">
                Deposit
              </div>
            </div>
            <div className="flex font-bold">{`${ElfToken?.symbol}: ${ElfToken?.balance}`}</div>
          </div>
        ) : null}
        <CommonBtn
          title={'Purchase'}
          onClick={() => onConfirm?.(inputVal, chancePrice)}
          className={`flex justify-center items-center font-fonarto ${
            isMobile
              ? 'text-[20px] leading-[20px] mt-[24px] h-[48px] mb-2'
              : '!text-[32px] !leading-[40px] mt-[40px] !h-[76px] mx-[64px] mb-[6px]'
          }`}
        />
      </div>
    </CustomModal>
  );
}