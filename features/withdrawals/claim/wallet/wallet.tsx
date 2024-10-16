import { memo } from 'react';

import { CHAINS } from '@lido-sdk/constants';
import { Divider } from '@lidofinance/lido-ui';
import { useSDK } from '@lido-sdk/react';

import { getConfig } from 'config';
import {
  WalletWrapperStyled,
  WalletMyRequests,
} from 'features/withdrawals/shared';
import { useDappStatus } from 'modules/web3';
import {
  CardAccount,
  CardRow,
  Fallback,
  LidoMultichainFallback,
} from 'shared/wallet';
import type { WalletComponentType } from 'shared/wallet/types';

import { WalletAvailableAmount } from './wallet-availale-amount';
import { WalletPendingAmount } from './wallet-pending-amount';

export const WalletComponent = () => {
  const { account } = useSDK();

  return (
    <WalletWrapperStyled data-testid="claimCardSection">
      <CardRow>
        <WalletAvailableAmount />
        <CardAccount account={account} />
      </CardRow>
      <Divider />
      <CardRow>
        <WalletMyRequests />
        <WalletPendingAmount />
      </CardRow>
    </WalletWrapperStyled>
  );
};

export const ClaimWallet: WalletComponentType = memo((props) => {
  const { defaultChain } = getConfig();
  const { isWalletConnected, isDappActive, isLidoMultichainChain } =
    useDappStatus();

  if (isLidoMultichainChain) {
    return (
      <LidoMultichainFallback textEnding={'to claim withdrawals'} {...props} />
    );
  }

  if (isWalletConnected && !isDappActive) {
    return (
      <Fallback
        error={`Unsupported chain. Please switch to ${CHAINS[defaultChain]} in your wallet.`}
        {...props}
      />
    );
  }

  if (!isDappActive) {
    return <Fallback {...props} />;
  }

  return <WalletComponent {...props} />;
});
