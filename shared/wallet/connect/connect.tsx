import { FC, useCallback } from 'react';
import { Button, ButtonProps } from '@lidofinance/lido-ui';
import { wrapWithEventTrack } from '@lidofinance/analytics-matomo';
import { MATOMO_CLICK_EVENTS } from 'config';
import { useClientConfig } from 'providers/client-config';
import { useConnectWalletModal } from '../connect-wallet-modal/use-connect-wallet-modal';
import { useConnectorInfo, useEagerConnect } from 'reef-knot/core-react';

export const Connect: FC<ButtonProps> = (props) => {
  const { isWalletConnectionAllowed } = useClientConfig();
  const { onClick, ...rest } = props;
  const { openModal } = useConnectWalletModal();
  const { isAutoConnectionSuitable } = useConnectorInfo();
  const { eagerConnect } = useEagerConnect();

  const handleClick = wrapWithEventTrack(
    MATOMO_CLICK_EVENTS.connectWallet,
    useCallback(() => {
      if (!isWalletConnectionAllowed) return;
      if (isAutoConnectionSuitable) {
        void eagerConnect();
      } else {
        openModal({});
      }
    }, [
      eagerConnect,
      isAutoConnectionSuitable,
      isWalletConnectionAllowed,
      openModal,
    ]),
  );

  return (
    <Button
      disabled={!isWalletConnectionAllowed}
      onClick={handleClick}
      data-testid="connectBtn"
      {...rest}
    >
      Connect wallet
    </Button>
  );
};
