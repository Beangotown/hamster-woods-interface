'use client';

import { ConfigProvider } from 'antd';
import StoreProvider from './store';

import enUS from 'antd/lib/locale/en_US';

import ETransferLayout from './ETransferLayout';
import WebLoginProvider from './webLoginProvider';

function Provider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreProvider>
        <ConfigProvider locale={enUS} autoInsertSpaceInButton={false} prefixCls={'ant'}>
          <WebLoginProvider>
            <ETransferLayout>{children}</ETransferLayout>
          </WebLoginProvider>
        </ConfigProvider>
      </StoreProvider>
    </>
  );
}

export default Provider;
