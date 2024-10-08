import { useCallback, useMemo } from 'react';
import { did, verification } from '@portkey/did-ui-react';
import { ChainId } from '@portkey/types';
import { AccountType, OperationTypeEnum } from '@portkey/services';
import { ConfigProvider } from '@portkey/did-ui-react';
import { IVerifier } from '@portkey/did-ui-react';
import { useVerifyToken } from '@portkey/did-ui-react';
import { ISocialLoginConfig } from '@portkey/did-ui-react';
import useReCaptchaModal from './useReCaptchaModal';

const useVerifier = () => {
  const verifyToken = useVerifyToken();
  const reCaptchaHandler = useReCaptchaModal();

  const socialLogin = useMemo<ISocialLoginConfig | undefined>(() => ConfigProvider.getSocialLoginConfig(), []);

  const getRecommendationVerifier: (chainId: ChainId) => Promise<IVerifier> = useCallback(
    async (chainId) =>
      did.services.getRecommendationVerifier({
        chainId,
      }),
    [],
  );

  const verifySocialToken = useCallback(
    async ({
      accountType,
      token,
      idToken,
      nonce,
      timestamp,
      guardianIdentifier,
      verifier,
      chainId,
      operationType,
      operationDetails,
    }: {
      guardianIdentifier: string;
      accountType: AccountType;
      token?: string;
      idToken?: string;
      nonce?: string;
      timestamp?: number;
      verifier: IVerifier;
      chainId: ChainId;
      operationType: OperationTypeEnum;
      operationDetails: string;
    }) => {
      let accessToken;
      let clientId;
      let redirectURI;
      let customLoginHandler;
      switch (accountType) {
        case 'Apple':
          accessToken = token;
          clientId = socialLogin?.Apple?.clientId;
          redirectURI = socialLogin?.Apple?.redirectURI;
          customLoginHandler = socialLogin?.Apple?.customLoginHandler;
          break;
        case 'Google':
          accessToken = token;
          clientId = socialLogin?.Google?.clientId;
          customLoginHandler = socialLogin?.Google?.customLoginHandler;
          break;
        case 'Telegram':
          accessToken = token;
          customLoginHandler = socialLogin?.Telegram?.customLoginHandler;
          break;
        default:
          throw 'accountType is not supported';
      }
      if (!verifier?.id) throw 'Verifier is not missing';
      return verifyToken(accountType, {
        accessToken,
        timestamp,
        nonce,
        idToken,
        id: guardianIdentifier,
        verifierId: verifier.id,
        chainId,
        clientId: clientId ?? '',
        redirectURI,
        operationType,
        operationDetails,
        customLoginHandler,
      });
    },
    [socialLogin, verifyToken],
  );

  const sendVerifyCode = useCallback(
    async ({
      accountType,
      guardianIdentifier,
      verifier,
      chainId,
      operationType,
    }: {
      guardianIdentifier: string;
      accountType: AccountType;
      verifier: IVerifier;
      chainId: ChainId;
      operationType: OperationTypeEnum;
    }) => {
      const result = await verification.sendVerificationCode(
        {
          params: {
            type: accountType,
            guardianIdentifier: guardianIdentifier.replaceAll(/\s+/g, ''),
            verifierId: verifier.id,
            chainId,
            operationType,
          },
        },
        reCaptchaHandler,
      );

      if (result.verifierSessionId) {
        return result;
      } else {
        console.error('sendVerificationCode params error');
      }

      return undefined;
    },
    [reCaptchaHandler],
  );

  return useMemo(
    () => ({ getRecommendationVerifier, verifySocialToken, sendVerifyCode }),
    [getRecommendationVerifier, verifySocialToken, sendVerifyCode],
  );
};

export default useVerifier;
