import {
  IClaimableInfoResult,
  IRankingHistoryResult,
  IRankingSeasonListResult,
  ISeasonRankResult,
  IWeeklyRankResult,
  TPastRecordResult,
} from 'components/Leaderboard/data/types';
import {
  IBalance,
  IBeanPassClaimReq,
  IBeanPassClaimReqEx,
  IBeanPassClaimRes,
  IBeanPassListItem,
  IChessboardDataResponse,
  IClaimAwardBody,
  IConfigResponse,
  IErrorResponse,
  IGetRankQuery,
  ILockInfoQuery,
  INoticeModalResponse,
  IPrice,
  IRankHistoryQuery,
  IServerConfig,
  ISetCurBeanBody,
  TLockInfosResponse,
  TPointInfo,
  TPointPurchaseInfo,
  TUnlockInfo,
} from 'types';
import request, { cmsRequest } from './axios';
import type { AxiosRequestConfig } from 'axios';

export const getHamsterPassClaimClaimable = async (
  query: IBeanPassClaimReq,
): Promise<IBeanPassClaimRes & IErrorResponse> => {
  return request.get('app/hamster-pass/claimable', { params: query });
};

export const receiveHamsterPassNFT = async (body: IBeanPassClaimReqEx): Promise<IBeanPassClaimRes> => {
  return request.post('app/hamster-pass/claim', body);
};

export const blockHeight = async (): Promise<number> => {
  return request.get('app/chain/blockHeight');
};

export const getWeekRank = async (query: IGetRankQuery): Promise<IWeeklyRankResult> => {
  return request.get('/app/rank/week-rank', { params: query });
};

export const getPastRecord = async (query: IGetRankQuery): Promise<TPastRecordResult> => {
  return request.get('/app/rank/history', { params: query });
};

export const claimAward = async (body: IClaimAwardBody): Promise<IClaimableInfoResult> => {
  return request.post('/app/reward/claim', body);
};

export const getSeasonRank = async (query: IGetRankQuery): Promise<ISeasonRankResult> => {
  return request.get<any>('/app/rank/season-rank', { params: query });
};

export const getSeasonList = async (): Promise<IRankingSeasonListResult> => {
  return request.get<any>('/app/rank/season-list');
};

export const getRankHistory = async (query: IRankHistoryQuery): Promise<IRankingHistoryResult> => {
  return request.get<any>('/app/rank/ranking-history', { params: query });
};

export const getPopup = async (params: { caAddress: string }): Promise<boolean> => {
  return request.post('app/bean-pass/popup', params);
};

export const fetchConfigItems = async (cfg: AxiosRequestConfig = {}): Promise<IConfigResponse> => {
  return cmsRequest.get<IConfigResponse>('items/config', cfg);
};

export const fetchChessboardData = async (url?: string): Promise<IChessboardDataResponse> => {
  return cmsRequest.get<IChessboardDataResponse>(`items/${url}` || 'items/chessboard_data');
};

export const fetchChessboardConfig = async (): Promise<{ data: Record<string, [string, string]> }> => {
  return cmsRequest.get<{ data: Record<string, [string, string]> }>('items/chessboard_config');
};

export const fetchNoticeModal = async (): Promise<INoticeModalResponse> => {
  return cmsRequest.get<INoticeModalResponse>('items/notice_modal');
};
export const fetchBeanPassList = async (query: { caAddress: string }): Promise<Array<IBeanPassListItem>> => {
  return request.get('/app/hamster-pass/nft-list', { params: query });
};

export const setCurUsingBeanPass = async (body: ISetCurBeanBody): Promise<IBeanPassListItem> => {
  return request.post('/app/bean-pass/using', body);
};

export const trackUnlockInfo = async (body: { caAddress: string; caHash: string }) => {
  return request.post('/app/trace/user-action', body);
};

export const fetchServerConfig = async (cfg: AxiosRequestConfig = {}): Promise<{ data: IServerConfig }> => {
  return request.get('app/hamster-pass/config', cfg);
};

export const fetchPrice = async (): Promise<IPrice> => {
  return request.get('app/hamster-pass/price');
};

export const fetchBalance = async (query: { caAddress: string }): Promise<IBalance[]> => {
  return request.get('app/hamster-pass/asset', { params: query });
};
export const getLockInfos = async (query: ILockInfoQuery): Promise<TLockInfosResponse> => {
  return request.get('/app/lock/locked-infos', { params: query });
};

export const getUnlockRecords = async (query: ILockInfoQuery): Promise<TUnlockInfo[]> => {
  return request.get('/app/lock/unlock-records', { params: query });
};

export const getDailyTask = async (query: IBeanPassClaimReq): Promise<TPointInfo[]> => {
  return request.get('/app/points/daily', { params: query });
};

export const getWeeklyTask = async (query: IBeanPassClaimReq): Promise<TPointPurchaseInfo[]> => {
  return request.get('/app/points/weekly', { params: query });
};

const noOp = () => undefined;
export const initConfigAndResource = async (
  configCallback: (res: IConfigResponse) => void = noOp,
  serverConfigCallback: (res: { data: IServerConfig }) => void = noOp,
  finalCallback: () => void = noOp,
) => {
  const serverConfigPromise = fetchServerConfig({ isCacheable: true });
  const configPromise = fetchConfigItems({ isCacheable: true });

  configPromise.then(configCallback);

  serverConfigPromise.then(serverConfigCallback);
  Promise.all([configPromise, serverConfigPromise]).then(finalCallback);
};
