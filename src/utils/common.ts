import { TelegramPlatform } from '@portkey/did-ui-react';
import dayjs from 'dayjs';

export const sleep = (time: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

const P_N_REG = /^[0-9]+\.?[0-9]*$/;

export function isValidNumber(n: string) {
  return P_N_REG.test(n);
}

export function isJWTExpired(expiredTimestamp: number) {
  return dayjs(expiredTimestamp).isBefore(dayjs());
}

export const isTelegramPlatform = TelegramPlatform.isTelegramPlatform();
