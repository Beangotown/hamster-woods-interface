import { getHamsterPassClaimClaimable } from 'api/request';
import { GetBeanPassStatus } from 'components/CommonModal/type';
import { BeanPassReasons } from 'types';
import { sleep } from 'utils/common';
import showMessage from 'utils/setGlobalComponentsInfo';

interface IProps {
  address: string;
  reTryCounts?: number;
  doubleClaimCallback?: () => void;
}

export const getBeanPassModalType: (params: IProps) => Promise<false | GetBeanPassStatus> = async ({
  address,
  reTryCounts,
}: IProps) => {
  let beanPassClaimClaimableRes;
  let beanPassModalType = GetBeanPassStatus.Abled;
  try {
    beanPassClaimClaimableRes = await getHamsterPassClaimClaimable({
      caAddress: address,
    });
    if (beanPassClaimClaimableRes?.code === '20002') {
      if (reTryCounts) {
        await sleep(1000);
        return getBeanPassModalType({
          address,
          reTryCounts: --reTryCounts,
        });
      } else {
        showMessage.hideLoading();
        showMessage.error(beanPassClaimClaimableRes.message);
        return false;
      }
    }
    showMessage.hideLoading();
  } catch (err) {
    showMessage.hideLoading();
    return false;
  }
  if (!beanPassClaimClaimableRes) return false;
  const { claimable, reason } = beanPassClaimClaimableRes;

  if (claimable) {
    beanPassModalType = GetBeanPassStatus.Abled;
  } else {
    if (reason === BeanPassReasons.Claimed) {
      beanPassModalType = GetBeanPassStatus.Noneleft;
    } else if (reason === BeanPassReasons.InsufficientElfAmount) {
      beanPassModalType = GetBeanPassStatus.Recharge;
    } else if (reason === BeanPassReasons.DoubleClaim) {
      beanPassModalType = GetBeanPassStatus.Notfound;
    }
  }

  return beanPassModalType;
};
