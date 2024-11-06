import {
  IBoutInformation,
  IContractError,
  IGameSetting,
  IPlayerInformation,
  IPlayerProps,
  IPurchaseProps,
  ITransactionResult,
} from 'types';
import contractRequest from './contractRequest';
import { formatErrorMsg } from 'utils/formattError';
import { store } from 'redux/store';
import { sleep } from 'utils/common';
import checkSynchronization from 'utils/checkSynchronization';
import { getTxResultOnce, getTxResultRetry } from 'utils/getTxResult';
import { SECONDS_60 } from 'constants/time';
import { ChainId } from '@portkey/types';
import { setGuardianListForFirstNeed, setIsManagerReadOnly } from 'redux/reducer/info';
const { configInfo } = store.getState();

export enum ContractMethodType {
  SEND,
  VIEW,
}
const bingoContract = async <T, R>(methodName: string, params: T, type: ContractMethodType) => {
  const contract = contractRequest.get();
  const contractAddress = configInfo.configInfo!.beanGoTownContractAddress;
  console.log('===configInfo', configInfo);
  const method = type === ContractMethodType.SEND ? 'callSendMethod' : 'callViewMethod';
  try {
    const res = await contract[method]({
      methodName,
      contractAddress,
      args: params,
    });

    return res as R;
  } catch (error) {
    const resError = error as IContractError;
    console.error('=====bingoContract', resError);
    return Promise.reject(formatErrorMsg(resError));
  }
};

export const CheckBeanPass = async (address: string): Promise<{ value: boolean } | IContractError> => {
  return await bingoContract('CheckBeanPass', address, ContractMethodType.VIEW);
};

export const GetPlayerInformation = async (address: string): Promise<IPlayerInformation> => {
  return await bingoContract('GetPlayerInformation', address, ContractMethodType.VIEW);
};

export const GetGameLimitSettings = async (): Promise<IGameSetting> => {
  return await bingoContract('GetGameLimitSettings', null, ContractMethodType.VIEW);
};

export const GetBoutInformation = async (playId: string, count = 2): Promise<IBoutInformation | undefined> => {
  try {
    const res: IBoutInformation = await bingoContract(
      'GetBoutInformation',
      {
        playId,
      },
      ContractMethodType.VIEW,
    );

    if (count && (res.score === 0 || res.gridNum === 0)) {
      await sleep(500);
      await GetBoutInformation(playId, --count);
    } else {
      return res;
    }
  } catch (error) {
    if (count) {
      await sleep(500);
      await GetBoutInformation(playId, --count);
    }
  }
};

export const Play = async ({
  resetStart,
  diceCount,
}: IPlayerProps): Promise<{ TransactionId: string; TxResult: ITransactionResult }> => {
  const contract = contractRequest.get();
  const contractAddress = configInfo.configInfo!.beanGoTownContractAddress;

  try {
    const { transactionId, chainId, rpcUrl } = await contract.callSendMethodNoResult({
      methodName: 'Play',
      contractAddress,
      args: {
        resetStart,
        diceCount,
        executeBingo: true,
      },
    });

    let result;

    await sleep(1000);
    const { status, txResult } = await getTxResultOnce(transactionId, rpcUrl!);
    result = txResult;
    if (['pending', 'notexisted'].includes(status)) {
      await sleep(500);
      const finalTxRes = await getTxResultRetry({
        TransactionId: transactionId!,
        chainId: chainId as ChainId,
        rpcUrl: rpcUrl!,
        rePendingEnd: new Date().getTime() + SECONDS_60,
      });
      result = finalTxRes.txResult;
    }

    store.dispatch(setGuardianListForFirstNeed([]));
    store.dispatch(setIsManagerReadOnly(false));

    return {
      TransactionId: transactionId,
      TxResult: result,
    };
  } catch (error) {
    const resError = error as IContractError;
    const res = await checkSynchronization(resError?.Error || '');
    if (!res) {
      return Promise.reject(
        formatErrorMsg({
          ...resError,
          message: 'Syncing on-chain account info',
        }),
      );
    }

    return Promise.reject(formatErrorMsg(resError));
  }
};

export const PurchaseChance = async ({
  value,
}: IPurchaseProps): Promise<{ TransactionId: string; TxResult: ITransactionResult }> => {
  const contract = contractRequest.get();
  const contractAddress = configInfo.configInfo!.beanGoTownContractAddress;
  console.log('PurchaseChance===', value);
  try {
    const { transactionId, chainId, rpcUrl } = await contract.callSendMethodNoResult({
      methodName: 'PurchaseChance',
      contractAddress,
      args: {
        value,
      },
    });

    let result;

    await sleep(1000);
    const { status, txResult } = await getTxResultOnce(transactionId, rpcUrl!);
    result = txResult;
    if (['pending', 'notexisted'].includes(status)) {
      await sleep(500);
      const finalTxRes = await getTxResultRetry({
        TransactionId: transactionId!,
        chainId: chainId as ChainId,
        rpcUrl: rpcUrl!,
        rePendingEnd: new Date().getTime() + SECONDS_60,
      });
      result = finalTxRes.txResult;
    }

    store.dispatch(setGuardianListForFirstNeed([]));
    store.dispatch(setIsManagerReadOnly(false));

    return {
      TransactionId: transactionId,
      TxResult: result,
    };
  } catch (error) {
    const resError = error as IContractError;
    const res = await checkSynchronization(resError?.Error || '');
    if (!res) {
      return Promise.reject(
        formatErrorMsg({
          ...resError,
          message: 'Syncing on-chain account info',
        }),
      );
    }

    return Promise.reject(formatErrorMsg(resError));
  }
};

export const GetBingoReward = async (params: IPlayerProps): Promise<IBoutInformation> => {
  try {
    console.log('===play GetBingoReward');
    const { TransactionId } = await Play(params);
    const rewardRes = await GetBoutInformation(TransactionId);
    if (rewardRes) {
      return rewardRes;
    }
    return Promise.reject();
  } catch (error) {
    return Promise.reject(error);
  }
};
