import { WalletType } from 'constants/index';
import { IPortkeyContract, getContractBasic } from '@portkey/contracts';
import { ChainId, IContract, SendOptions } from '@portkey/types';
import { MethodsWallet } from '@portkey/provider-types';
import { NetworkType, did, handleErrorMessage, managerApprove } from '@portkey/did-ui-react';

import { CallContractParams, IDiscoverInfo, PortkeyInfoType, WalletInfoType } from 'types';
import { getAElfInstance, getViewWallet } from 'utils/contractInstance';
import { aelf } from '@portkey/utils';
import { getTxResultRetry } from 'utils/getTxResult';
import DetectProvider from 'utils/InstanceProvider';
import { ChainInfo, Manager } from '@portkey/services';
import { store } from 'redux/store';
import { SECONDS_60 } from 'constants/time';
import { MethodType, SentryMessageType, captureMessage } from 'utils/captureMessage';
import getAccountInfoSync from 'utils/getAccountInfoSync';
import { compareVersion } from 'utils/version';
import BigNumber from 'bignumber.js';
import { timesDecimals } from 'utils/calculate';
import { message } from 'antd';
import { StorageUtils } from 'utils/storage.utils';

interface IContractConfig {
  chainId: ChainId;
  rpcUrl?: string;
  contractAddress: string;
  discoverRpcUrl?: string;
}

interface IWallet {
  discoverInfo?: IDiscoverInfo;
  portkeyInfo?: PortkeyInfoType;
}

interface IViewContract {
  [props: string]: {
    call: any;
  };
}

export default class ContractRequest {
  private static instance: ContractRequest | null = null;
  private walletType: WalletType = WalletType.unknown;
  private chainId: ChainId | undefined;
  private rpcUrl: string | undefined;
  private wallet: IWallet = {};
  public caContractProvider?: IContract;
  public caContract?: IPortkeyContract;
  public viewContractMap: { [x: string]: IPortkeyContract };

  public viewContract?: IViewContract;
  public tokenContractView?: IPortkeyContract;
  public chainInfoMap?: { [chainId in ChainId]: ChainInfo };

  private caAddress: string | undefined;
  private caHash: string | undefined;
  constructor() {
    this.viewContractMap = {};
  }
  static get() {
    if (!ContractRequest.instance) {
      ContractRequest.instance = new ContractRequest();
    }
    return ContractRequest.instance;
  }

  public setConfig(config: IContractConfig) {
    const { info } = store.getState();
    this.chainId = config.chainId;
    const rpcUrl = info.walletType === WalletType.discover ? config.discoverRpcUrl : config.rpcUrl;
    this.rpcUrl = rpcUrl;
    this.initCaContract(config.contractAddress);
  }

  public resetConfig() {
    this.chainId = undefined;
    this.rpcUrl = undefined;
    this.caContractProvider = undefined;
    this.caContract = undefined;
    this.viewContract = undefined;
    this.caAddress = undefined;
    this.caHash = undefined;
    this.walletType = WalletType.unknown;
    this.wallet = {};
    this.tokenContractView = undefined;
    this.chainInfoMap = undefined;
  }

  public setWallet(wallet: WalletInfoType, walletType: WalletType) {
    if (wallet) {
      this.walletType = walletType;
      if (walletType === WalletType.discover) {
        this.wallet.discoverInfo = wallet.discoverInfo;
        this.caAddress = wallet.discoverInfo?.address;
      } else {
        this.wallet.portkeyInfo = wallet.portkeyInfo;
      }
    }
  }

  public async initCaContract(contractAddress: string) {
    if (this.walletType === WalletType.discover) {
      this.caContractProvider = await this.getProviderCaContract(contractAddress);
    } else {
      this.caContract = await this.getCaContract();
    }

    this.viewContract = await this.getViewContract(contractAddress);
  }

  public getChainInfoMap = async () => {
    if (!this.chainInfoMap) {
      const chainsList = await did.services.getChainsInfo();
      const chainInfoMap = {} as any;
      chainsList.forEach((item) => {
        chainInfoMap[item.chainId] = item;
      });
      this.chainInfoMap = chainInfoMap;
    }
    return this.chainInfoMap;
  };

  public getChainInfo = async (_chainId?: ChainId) => {
    const defaultChainId = process.env.NEXT_PUBLIC_APP_ENV === 'test' ? 'tDVW' : 'tDVV';
    const chainId = _chainId ?? this.chainId ?? defaultChainId;
    const chainInfoMap = await this.getChainInfoMap();
    const chainInfo = chainInfoMap?.[chainId];
    if (!chainInfo) {
      throw new Error(`Chain is not running: ${this.chainId}`);
    }
    return chainInfo;
  };

  public getTokenContractView = async () => {
    if (this.tokenContractView) return this.tokenContractView;
    const chainInfo = await this.getChainInfo(this.chainId as ChainId);
    const tokenAddress = chainInfo.defaultToken.address;
    this.tokenContractView = await this.getViewContracts(
      this.rpcUrl || chainInfo.endPoint,
      chainInfo.chainId,
      tokenAddress,
    );

    return this.tokenContractView;
  };

  public getBalance = async ({ symbol, owner }: { symbol: string; owner: string }) => {
    const tokenContract = await this.getTokenContractView();
    const balanceRes = await tokenContract.callViewMethod('GetBalance', {
      symbol,
      owner,
    });

    if (balanceRes.error) {
      throw balanceRes.error;
    }
    return balanceRes.data;
  };

  public checkAllowanceAndApprove = async ({
    approveTargetAddress,
    amount,
    symbol,
  }: {
    approveTargetAddress: string;
    amount: string | number;
    symbol: string;
  }) => {
    try {
      const account =
        this.walletType === WalletType.discover
          ? this.wallet?.discoverInfo?.address
          : this.wallet?.portkeyInfo?.caInfo?.caAddress;
      if (!account) throw Error('Please login');
      if (!this.chainId) throw Error('Something went wrong(chainId)');

      const tokenContract = await this.getTokenContractView();
      const [{ data: allowance }, { data: tokenInfo }] = await Promise.all([
        tokenContract.callViewMethod('GetAvailableAllowance', {
          symbol,
          owner: account,
          spender: approveTargetAddress,
        }),
        tokenContract.callViewMethod('GetTokenInfo', { symbol }),
      ]);

      console.log(allowance, 'allowance====checkAllowanceAndApprove');

      const allowanceBN = new BigNumber(allowance.allowance ?? allowance.amount ?? 0);
      const bigA = timesDecimals(amount, tokenInfo.decimals ?? 8);

      if (allowanceBN.gte(bigA)) return true;
      const approveAmount = bigA.toNumber();

      if (this.walletType === WalletType.discover) {
        const chainInfo = await this.getChainInfo(this.chainId);

        const dp = await DetectProvider.getDetectProvider();
        const chainProvider = await dp?.getChain(this.chainId as ChainId);
        if (!chainProvider) return;
        const portkeyContract = await getContractBasic({
          contractAddress: chainInfo.caContractAddress,
          chainProvider: chainProvider,
        });

        const result = await portkeyContract.callSendMethod('ManagerApprove', '', {
          spender: approveTargetAddress,
          symbol,
          amount: approveAmount,
        });
        if (result?.error) throw result.error;
        return true;
      } else if (this.walletType === WalletType.portkey) {
        const originChainId = (StorageUtils.getOriginChainId() || 'tDVV') as ChainId;

        const result = await managerApprove({
          originChainId,
          symbol,
          caHash: this.caHash || '',
          amount: approveAmount,
          targetChainId: this.chainId,
          networkType: (store.getState().configInfo.configInfo?.network || 'MAINNET') as NetworkType,
          batchApproveNFT: true,
          dappInfo: {
            icon: '/favicon.ico',
            href: location.origin,
            name: 'Hamster Woods',
          },
          spender: approveTargetAddress,
        });
        const portkeyContract = await this.getCaContract();
        const approveResult = await portkeyContract?.callSendMethod('ManagerApprove', '', {
          caHash: this.caHash || '',
          spender: approveTargetAddress,
          symbol: result.symbol,
          amount: result.amount,
          guardiansApproved: result.guardiansApproved,
        });
        if (approveResult.error) throw approveResult.error;
        return true;
      } else {
        throw Error('Please login or refresh page');
      }
    } catch (error) {
      message.error(handleErrorMessage(error, 'Token approver error'));
      return false;
    }
  };

  private getCaContract = async () => {
    if (!this.caContract) {
      const chainInfo = await this.getChainInfo(this.chainId);
      if (!chainInfo) {
        throw new Error(`Chain is not running: ${this.chainId}`);
      }

      // TODO
      const didWalletInfo = this.wallet.portkeyInfo!;
      const account = aelf.getWallet(did.didWallet.managementAccount?.privateKey || '');
      const caContract = await getContractBasic({
        contractAddress: chainInfo.caContractAddress,
        account,
        rpcUrl: this.rpcUrl,
      });
      this.caContract = caContract;

      this.caAddress = didWalletInfo?.walletInfo?.address;
      this.caHash = didWalletInfo?.caInfo?.caHash;
    }
    return this.caContract;
  };

  public getViewContracts = async (rpcUrl: string, chainId: ChainId, address: string) => {
    const key = rpcUrl + chainId + address;
    if (!this.viewContractMap[key]) {
      const aelfInstance = getAElfInstance(rpcUrl);

      this.viewContractMap[key] = await getContractBasic({
        aelfInstance,
        contractAddress: address,
        account: aelf.getWallet('f6e512a3c259e5f9af981d7f99d245aa5bc52fe448495e0b0dd56e8406be6f71'),
      });
    }
    return this.viewContractMap[key];
  };

  private getViewContract = async (contractAddress: string) => {
    if (!this.viewContract) {
      const aelfInstance = getAElfInstance(this.rpcUrl!);
      const viewWallet = getViewWallet();

      const contract = await aelfInstance.chain.contractAt(contractAddress, viewWallet);
      this.viewContract = contract;
    }
    return this.viewContract;
  };

  private getProviderCaContract = async (contractAddress: string) => {
    if (!this.caContractProvider) {
      const dp = await DetectProvider.getDetectProvider();
      const chainProvider = await dp?.getChain(this.chainId as ChainId);
      if (!chainProvider) return;
      const contract = await getContractBasic({
        contractAddress: contractAddress,
        chainProvider: chainProvider,
      });
      this.caContractProvider = contract;
      return contract;
    }
    return this.caContractProvider;
  };

  private contractCaptureMessage = <T, R>(params: CallContractParams<T>, result: R, method: MethodType) => {
    captureMessage({
      type: SentryMessageType.CONTRACT,
      params: {
        name: params.methodName,
        method: method,
        query: params.args,
        description: result,
        walletAddress: this.caAddress,
        contractAddress: params.contractAddress,
      },
    });
  };

  public async callSendMethod<T, R>(params: CallContractParams<T>, sendOptions?: SendOptions) {
    if (this.walletType === WalletType.unknown) {
      throw new Error('Wallet not login');
    }

    let result: R | any;

    const walletType = this.walletType;
    switch (walletType) {
      case WalletType.discover: {
        const discoverInfo = this.wallet.discoverInfo!;
        try {
          const contract = await this.getProviderCaContract(params.contractAddress);
          const accounts = discoverInfo.accounts;

          if (!accounts) {
            throw new Error('Account not found');
          }

          const accountsInChain = accounts[this.chainId as ChainId];
          if (!accountsInChain || accountsInChain.length === 0) {
            throw new Error(`Account not found in chain: ${this.chainId}`);
          }
          const address = accountsInChain[0];
          result = await contract?.callSendMethod(params.methodName, address, params.args, {
            onMethod: 'transactionHash',
          });
          console.log(result);
        } catch (error: any) {
          console.error('=====callSendMethod error', error);
          this.contractCaptureMessage(params, error, MethodType.CALLSENDMETHOD);
          return Promise.reject(error);
        }
        break;
      }
      case WalletType.portkey: {
        try {
          result = await this.caContract?.callSendMethod(
            'ManagerForwardCall',
            this.caAddress!,
            {
              // guardiansApproved: store.getState().info.guardianListForFirstNeed,
              caHash: this.caHash,
              contractAddress: params.contractAddress,
              methodName: params.methodName,
              args: params.args,
            },
            { onMethod: 'transactionHash' },
          );
        } catch (error) {
          this.contractCaptureMessage(params, error, MethodType.CALLSENDMETHOD);
          return Promise.reject(error);
        }
      }
    }

    if (result?.error || result?.code || result?.Error) {
      console.error('=====callSendMethod error result', result);
      this.contractCaptureMessage(params, result, MethodType.CALLSENDMETHOD);
      return Promise.reject(result);
    }

    const { transactionId, TransactionId } = result?.result || result;
    const resTransactionId = TransactionId || transactionId;
    const transaction = await getTxResultRetry({
      TransactionId: resTransactionId!,
      chainId: this.chainId as ChainId,
      rpcUrl: this.rpcUrl!,
      rePendingEnd: new Date().getTime() + SECONDS_60,
    });

    return Promise.resolve({
      TransactionId: transaction.TransactionId,
      TransactionResult: transaction.txResult,
    });
  }

  public async callSendMethodNoResult<T, R>(params: CallContractParams<T>) {
    if (this.walletType === WalletType.unknown) {
      throw new Error('Wallet not login');
    }

    let result: R | any;

    const walletType = this.walletType;
    switch (walletType) {
      case WalletType.discover: {
        const discoverInfo = this.wallet.discoverInfo!;
        try {
          const contract = await this.getProviderCaContract(params.contractAddress);
          const accounts = discoverInfo.accounts;

          if (!accounts) {
            throw new Error('Account not found');
          }

          const accountsInChain = accounts[this.chainId as ChainId];
          if (!accountsInChain || accountsInChain.length === 0) {
            throw new Error(`Account not found in chain: ${this.chainId}`);
          }
          const address = accountsInChain[0];
          result = await contract?.callSendMethod(params.methodName, address, params.args, {
            onMethod: 'transactionHash',
          });
        } catch (error) {
          console.error('=====callSendMethodNoResult error discover', error);
          this.contractCaptureMessage(params, error, MethodType.CALLSENDMETHOD);
          return Promise.reject(error);
        }
        break;
      }
      case WalletType.portkey: {
        try {
          console.log('wfs----LoadingModal---guardianListForFirstNeed', store.getState().info.guardianListForFirstNeed);
          result = await this.caContract?.callSendMethod(
            'ManagerForwardCall',
            this.caAddress!,
            {
              guardiansApproved: store.getState().info.guardianListForFirstNeed,
              caHash: this.caHash,
              contractAddress: params.contractAddress,
              methodName: params.methodName,
              args: params.args,
            },
            { onMethod: 'transactionHash' },
          );
          console.log('wfs----LoadingModal---result', result);
        } catch (error) {
          console.error('=====callSendMethodNoResult error portkey', error);
          this.contractCaptureMessage(params, error, MethodType.CALLSENDMETHOD);
          return Promise.reject(error);
        }
      }
    }

    if (result?.error || result?.code || result?.Error) {
      console.error('=====callSendMethodNoResult result', result);
      this.contractCaptureMessage(params, result, MethodType.CALLSENDMETHOD);
      return Promise.reject(result);
    }
    const { transactionId, TransactionId } = result?.result || result;
    const resTransactionId = TransactionId || transactionId;

    return Promise.resolve({
      transactionId: resTransactionId,
      chainId: this.chainId,
      rpcUrl: this.rpcUrl,
    });
  }

  public async callViewMethod<T, R>(params: CallContractParams<T>): Promise<R> {
    try {
      const contract = await this.getViewContract(params.contractAddress);
      let res;
      if (!params.args) {
        res = await contract![params.methodName].call();
      } else {
        res = await contract![params.methodName].call(params.args);
      }
      return res;
    } catch (error) {
      this.contractCaptureMessage(params, error, MethodType.CALLVIEWMETHOD);
      return Promise.reject(error);
    }
  }

  public async getSyncChainStatus() {
    if (this.walletType === WalletType.discover) {
      let version = undefined;
      try {
        const provider = await DetectProvider.getDetectProvider();
        if (!provider) throw Error('Provider not found');

        const providerVersion = compareVersion(provider.providerVersion, '0.0.1');
        version = providerVersion;
        let syncStatus = false;
        if (providerVersion > 0) {
          const status = await provider.request({
            method: MethodsWallet.GET_WALLET_MANAGER_SYNC_STATUS,
            payload: { chainId: this.chainId },
          });
          syncStatus = !!status;
        } else {
          syncStatus = await this.getHolder(this.caAddress!);
        }
        return syncStatus;
      } catch (error) {
        captureMessage({
          type: SentryMessageType.ERROR,
          params: {
            name: 'getSyncChainStatus',
            method: MethodType.NON,
            query: {
              type: 'discover',
              version,
            },
            description: error,
            walletAddress: this.caAddress,
          },
        });
        console.error('=====getSyncChainStatus error', error);
        return false;
      }
    } else {
      try {
        const accountSyncInfo = await getAccountInfoSync(this.chainId!, this.wallet.portkeyInfo);
        const { holder, filteredHolders } = accountSyncInfo!;
        if (holder && filteredHolders && filteredHolders.length) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        captureMessage({
          type: SentryMessageType.ERROR,
          params: {
            name: 'getSyncChainStatus',
            method: MethodType.NON,
            query: {
              type: 'SDK',
            },
            description: error,
            walletAddress: this.caAddress,
          },
        });
        console.error('=====getSyncChainStatus error', error);
        return false;
      }
    }
  }

  public async getHolder(caAddress: string) {
    // get caHash
    const rst = await did.services.communityRecovery.getHolderInfoByManager({
      caAddresses: [caAddress],
    } as any);
    const caHash = rst[0].caHash;
    let managerInfo: Manager[] = [];
    const originChainId = rst[0].originChainId;

    // get every chain HolderInfo
    const chainsInfoMap = await this.getChainInfoMap();
    const chainsInfo = Object.values(chainsInfoMap ?? {});
    const result = await Promise.all(
      chainsInfo.map(async (item) => {
        const contract = await this.getViewContracts(item.endPoint, item.chainId, item.caContractAddress);
        const info = await contract.callViewMethod('GetHolderInfo', {
          caHash,
        });
        if (item.chainId === originChainId) managerInfo = info.data.managerInfos;
        return info.data;
      }),
    );

    // compare
    const managerList = result.map((item) => {
      return item.managerInfos as Manager[];
    });

    const managerInfoStr = JSON.stringify(managerInfo);
    const isSame = managerList.every((item) => JSON.stringify(item) === managerInfoStr);

    if (isSame) return true;
    const lastManager = managerInfo.slice(-1)[0].address;
    const isLastManager = managerList.every((item) => item.slice(-1)[0].address === lastManager);
    if (isLastManager) return true;
    return false;
  }
}
