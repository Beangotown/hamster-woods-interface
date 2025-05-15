'use client';

import { ConfigProvider } from 'antd';
import StoreProvider from './store';

import enUS from 'antd/lib/locale/en_US';

import ETransferLayout from './ETransferLayout';
import WebLoginProvider from './webLoginProvider';
import { initConfigAndResource } from 'api/request';
import dynamic from 'next/dynamic';
import WebWalletProvider from './WebWalletProvider';

const Provider = dynamic(
  async () =>
    ({ children }: { children: React.ReactNode }) => {
      // side-effect free eager fetch of config
      initConfigAndResource();
      return (
        <>
          <StoreProvider>
            <ConfigProvider locale={enUS} autoInsertSpaceInButton={false} prefixCls={'ant'}>
              <WebWalletProvider>
                <WebLoginProvider>
                  <ETransferLayout>{children}</ETransferLayout>
                </WebLoginProvider>
              </WebWalletProvider>
            </ConfigProvider>
          </StoreProvider>
        </>
      );
    },
  { ssr: false },
);

export default Provider;
