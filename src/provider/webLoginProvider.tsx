'use client';

import { NetworkType, PortkeyProvider } from '@portkey/did-ui-react';
import '@portkey/did-ui-react/dist/assets/index.css';
import useGetState from 'redux/state/useGetState';

const WebLoginProvider = ({ children }: { children: React.ReactNode }) => {
  const { configInfo } = useGetState();

  if (!configInfo) {
    return <>{children}</>;
  }
  return <PortkeyProvider networkType={configInfo?.network as NetworkType}>{children}</PortkeyProvider>;
};

export default WebLoginProvider;
