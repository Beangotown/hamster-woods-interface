import axios from 'axios';

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cmsUrl } from 'constants/cms';
import { SentryMessageType, captureMessage } from 'utils/captureMessage';
import showMessage from 'utils/setGlobalComponentsInfo';

interface ResponseType<T> {
  code: string;
  message: string;
  data: T;
}

type Config = {
  uniqueUrl?: string;
};
const pendings: Config = {};
const caches: Config = {};
const cacheUtils = {
  getUniqueUrl: (config: AxiosRequestConfig) => {
    // you can set the rule based on your own requirement
    return config.url + '&' + config.method;
  },
  isCached: function (config: AxiosRequestConfig) {
    const uniqueUrl = this.getUniqueUrl(config) as keyof Config;
    return caches[uniqueUrl] !== undefined;
  },
  isPending: function (config: AxiosRequestConfig) {
    const uniqueUrl = this.getUniqueUrl(config);
    if (!pendings[uniqueUrl]) {
      pendings[uniqueUrl] = [config];
      return false;
    } else {
      console.log(`cache url: ${uniqueUrl}`);
      pendings[uniqueUrl].push(config);
      return true;
    }
  },
  setCachedResponse: function (config: AxiosRequestConfig, response: AxiosResponse) {
    const uniqueUrl = this.getUniqueUrl(config);
    caches[uniqueUrl] = response;
    if (pendings[uniqueUrl]) {
      pendings[uniqueUrl].forEach((configItem) => {
        configItem.isFinished = true;
      });
    }
  },
  getError: function (config) {
    const skipXHRError = new Error('skip');
    skipXHRError.isSkipXHR = true;
    skipXHRError.requestConfig = config;
    return skipXHRError;
  },
  getCachedResponse: function (config) {
    const uniqueUrl = this.getUniqueUrl(config);
    return caches[uniqueUrl];
  },
};

class Request {
  instance: AxiosInstance;
  baseConfig: AxiosRequestConfig = { baseURL: '/api', timeout: 60000 };

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(Object.assign({}, this.baseConfig, config));

    // This should be the *first* response interceptor to add
    this.instance.interceptors.response.use(
      function (response) {
        cacheUtils.setCachedResponse(response.config, response);
        return response;
      },
      function (error) {
        /* recover from error back to normality
         * but this time we use an cached response result
         **/
        if (error.isSkipXHR) {
          return cacheUtils.getCachedResponse(error.request);
        }
        console.error(`something were wrong when fetch ${config?.url}`, error);
        return Promise.reject(error);
      },
    );

    this.instance.interceptors.response.use(
      <T>(response: AxiosResponse<ResponseType<T>>) => {
        const config = response.config;
        // need to opt-in with .isCacheable
        if (config.isCacheable) {
          if (cacheUtils.isCached(config)) {
            const error = cacheUtils.getError(config);
            throw error;
          }
          if (cacheUtils.isPending(config)) {
            return new Promise((resolve, reject) => {
              const interval = setInterval(() => {
                if (config.isFinished) {
                  clearInterval(interval);
                  const error = cacheUtils.getError(config);
                  reject(error);
                }
              }, 200);
            });
          }
        }
        const res = response.data;
        const { code, data, message: errorMessage } = response.data;
        if (config.baseURL?.includes('cms')) {
          return data;
        }
        if (config.baseURL?.includes('connect')) {
          return res;
        }

        if (code[0] !== '2') {
          captureMessage({
            type: SentryMessageType.HTTP,
            params: {
              name: config.url!,
              method: config.method!,
              query: config.data,
              description: response,
            },
          });
        }

        switch (code) {
          case '20000':
            return data;
          case '20001':
            return {};
          case '20002':
            return res;
          case '50000':
            showMessage.error(errorMessage);
            return null;
          default:
            showMessage.error(errorMessage);
            return res;
        }
      },
      (error) => {
        if (error.isSkipXHR) {
          return cacheUtils.getCachedResponse(error.request);
        }
        let errMessage = '';
        switch (error?.response?.status) {
          case 400:
            errMessage = 'Please check your internet connection and try again.';
            break;

          case 401:
            showMessage.error('Please check your internet connection and try again.');
            setTimeout(() => {
              location.pathname = '/login';
            }, 3000);
            break;

          case 404:
            errMessage = 'Please check your internet connection and try again.';
            break;

          case 500:
          case 501:
          case 502:
          case 503:
          case 504:
            errMessage = 'Please check your internet connection and try again.';
            break;

          default:
            errMessage = 'Please check your internet connection and try again.';
            break;
        }

        showMessage.error(errMessage);
        captureMessage({
          type: SentryMessageType.HTTP,
          params: {
            name: config.url!,
            method: config.method!,
            query: config.data,
            description: error,
          },
        });
        return Promise.reject(errMessage);
      },
    );
  }

  public async request(config: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.instance.request(config);
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  public post<T, R>(url: string, data?: T, config?: AxiosRequestConfig): Promise<R> {
    return this.instance.post(url, data, config);
  }

  public put<T = any, R = AxiosResponse<T>, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<R> {
    return this.instance.put(url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}

const cmsRequest = new Request({ baseURL: cmsUrl });
// const tokenRequest = new Request({
//   baseURL: '/connect',
// });

const req = new Request({});
export default req;

export { cmsRequest };
