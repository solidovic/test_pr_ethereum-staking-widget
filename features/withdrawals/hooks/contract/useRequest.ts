/* eslint-disable sonarjs/no-identical-functions */
import { useCallback } from 'react';
import invariant from 'tiny-invariant';
import { useAccount } from 'wagmi';

import {
  useSDK,
  useSTETHContractRPC,
  useWSTETHContractRPC,
} from '@lido-sdk/react';
import { getWithdrawalQueueAddress } from '@lido-sdk/constants';

import { TOKENS_WITHDRAWABLE } from 'features/withdrawals/types/tokens-withdrawable';
import { useWithdrawals } from 'features/withdrawals/contexts/withdrawals-context';
import {
  GatherPermitSignatureResult,
  useERC20PermitSignature,
} from 'shared/hooks';
import { useCurrentStaticRpcProvider } from 'shared/hooks/use-current-static-rpc-provider';
import { useApproveOnL1 } from 'shared/hooks/useApproveOnL1';
import { runWithTransactionLogger } from 'utils';
import { isContract } from 'utils/isContract';

import { useWithdrawalsContract } from './useWithdrawalsContract';
import { useTxModalStagesRequest } from 'features/withdrawals/request/transaction-modal-request/use-tx-modal-stages-request';
import { useTransactionModal } from 'shared/transaction-modal/transaction-modal';
import {
  sendTx,
  useTxConfirmation,
  useIsMultisig,
  useDappStatus,
  ZERO,
} from 'modules/web3';
import { overrideWithQAMockBoolean } from 'utils/qa';

// this encapsulates permit/approval & steth/wsteth flows
const useWithdrawalRequestMethods = () => {
  const { providerWeb3 } = useSDK();
  const { staticRpcProvider } = useCurrentStaticRpcProvider();
  const { address, contractWeb3 } = useWithdrawalsContract();

  const permitSteth = useCallback(
    async ({
      signature,
      requests,
    }: {
      signature?: GatherPermitSignatureResult;
      requests: bigint[];
    }) => {
      invariant(providerWeb3, 'must have providerWeb3');
      invariant(signature, 'must have signature');
      invariant(contractWeb3, 'must have contractWeb3');

      const tx =
        await contractWeb3.populateTransaction.requestWithdrawalsWithPermit(
          requests,
          signature.owner,
          {
            value: signature.value,
            deadline: signature.deadline,
            v: signature.v,
            r: signature.r,
            s: signature.s,
          },
        );

      const callback = () =>
        sendTx({
          tx,
          isMultisig: false,
          staticProvider: staticRpcProvider,
          walletProvider: providerWeb3,
        });

      return callback;
    },
    [contractWeb3, providerWeb3, staticRpcProvider],
  );

  const permitWsteth = useCallback(
    async ({
      signature,
      requests,
    }: {
      signature?: GatherPermitSignatureResult;
      requests: bigint[];
    }) => {
      invariant(signature, 'must have signature');
      invariant(providerWeb3, 'must have providerWeb3');
      invariant(contractWeb3, 'must have contractWeb3');

      const tx =
        await contractWeb3.populateTransaction.requestWithdrawalsWstETHWithPermit(
          requests,
          signature.owner,
          {
            value: signature.value,
            deadline: signature.deadline,
            v: signature.v,
            r: signature.r,
            s: signature.s,
          },
        );

      const callback = () =>
        sendTx({
          tx,
          isMultisig: false,
          staticProvider: staticRpcProvider,
          walletProvider: providerWeb3,
        });

      return callback;
    },
    [contractWeb3, providerWeb3, staticRpcProvider],
  );

  const steth = useCallback(
    async ({ requests }: { requests: bigint[] }) => {
      invariant(address, 'must have account');
      invariant(contractWeb3, 'must have contractWeb3');
      invariant(providerWeb3, 'must have providerWeb3');

      const isMultisig = await isContract(address, staticRpcProvider);

      const tx = await contractWeb3.populateTransaction.requestWithdrawals(
        requests,
        address,
      );

      const callback = async () =>
        sendTx({
          tx,
          isMultisig,
          staticProvider: staticRpcProvider,
          walletProvider: providerWeb3,
        });

      return callback;
    },
    [address, contractWeb3, staticRpcProvider, providerWeb3],
  );

  const wstETH = useCallback(
    async ({ requests }: { requests: bigint[] }) => {
      invariant(address, 'must have address');
      invariant(contractWeb3, 'must have contractWeb3');
      invariant(providerWeb3, 'must have providerWeb3');
      const isMultisig = await isContract(address, staticRpcProvider);

      const tx =
        await contractWeb3.populateTransaction.requestWithdrawalsWstETH(
          requests,
          address,
        );

      const callback = async () =>
        sendTx({
          tx,
          isMultisig,
          staticProvider: staticRpcProvider,
          walletProvider: providerWeb3,
        });

      return callback;
    },
    [address, contractWeb3, staticRpcProvider, providerWeb3],
  );

  return useCallback(
    (isAllowance: boolean, token: TOKENS_WITHDRAWABLE) => {
      return token == TOKENS_WITHDRAWABLE.stETH
        ? isAllowance
          ? steth
          : permitSteth
        : isAllowance
          ? wstETH
          : permitWsteth;
    },
    [permitSteth, permitWsteth, steth, wstETH],
  );
};

// provides form with a handler to call signing flow
// and all needed indicators for ux

type useWithdrawalRequestParams = {
  amount: bigint | null;
  token: TOKENS_WITHDRAWABLE;
  onConfirm?: () => Promise<void>;
  onRetry?: () => void;
};

export const useWithdrawalRequest = ({
  amount,
  token,
  onConfirm,
  onRetry,
}: useWithdrawalRequestParams) => {
  const { chainId } = useSDK();
  const { address } = useDappStatus();
  const withdrawalQueueAddress = getWithdrawalQueueAddress(chainId);

  const { connector } = useAccount();
  const { isBunker } = useWithdrawals();
  const { txModalStages } = useTxModalStagesRequest();
  const getRequestMethod = useWithdrawalRequestMethods();
  const { isMultisig, isLoading: isMultisigLoading } = useIsMultisig();
  const waitForTx = useTxConfirmation();

  const wstethContract = useWSTETHContractRPC();
  const stethContract = useSTETHContractRPC();
  const tokenContract =
    token === TOKENS_WITHDRAWABLE.stETH ? stethContract : wstethContract;

  const { closeModal } = useTransactionModal();

  const valueBigInt = amount ?? ZERO;

  // TODO  split into async callback and pauseable SWR
  const {
    approve,
    needsApprove,
    allowance,
    isLoading: loadingUseApprove,
    refetch: refetchAllowance,
  } = useApproveOnL1(
    valueBigInt,
    tokenContract.address,
    withdrawalQueueAddress,
    address ?? undefined,
  );

  const { gatherPermitSignature } = useERC20PermitSignature({
    tokenProvider: tokenContract,
    spender: withdrawalQueueAddress,
  });

  const isWalletConnect = overrideWithQAMockBoolean(
    connector?.id === 'walletConnect',
    'mock-qa-helpers-force-approval-withdrawal-wallet-connect',
  );

  const isApprovalFlow = Boolean(
    isWalletConnect ||
      isMultisig ||
      (allowance && allowance > ZERO && !needsApprove),
  );

  const isApprovalFlowLoading =
    isMultisigLoading || (isApprovalFlow && loadingUseApprove);

  const isTokenLocked = isApprovalFlow && needsApprove;

  const request = useCallback(
    async ({
      requests,
      amount,
      token,
    }: {
      requests: bigint[] | null;
      amount: bigint | null;
      token: TOKENS_WITHDRAWABLE;
    }) => {
      // define and set retry point
      try {
        invariant(
          requests && request.length > 0,
          'cannot submit empty requests',
        );
        invariant(amount, 'cannot submit empty amount');

        if (isBunker) {
          const bunkerDialogResult = await txModalStages.dialogBunker();
          if (!bunkerDialogResult) {
            closeModal();
            return false;
          }
        }

        // get right method
        const method = getRequestMethod(isApprovalFlow, token);

        let signature: GatherPermitSignatureResult | undefined;

        // each flow switches needed signing stages
        if (isApprovalFlow) {
          if (needsApprove) {
            txModalStages.signApproval(amount, token);

            await approve({
              onTxSent: (txHash) => {
                if (!isMultisig) {
                  txModalStages.pendingApproval(amount, token, txHash);
                }
              },
            });
            if (isMultisig) {
              txModalStages.successMultisig();
              return true;
            }
          }
        } else {
          txModalStages.signPermit();
          signature = await gatherPermitSignature(amount);
        }

        txModalStages.sign(amount, token);

        const callback = await method({ signature, requests });
        const txHash = await runWithTransactionLogger(
          'Request signing',
          callback,
        );

        if (isMultisig) {
          txModalStages.successMultisig();
          return true;
        }

        txModalStages.pending(amount, token, txHash);

        if (!isMultisig) {
          await runWithTransactionLogger(
            'Withdrawal Request block confirmation',
            () => waitForTx(txHash),
          );
        }

        await Promise.all([
          onConfirm?.(),
          isApprovalFlow &&
            refetchAllowance({ throwOnError: false, cancelRefetch: false }),
        ]);
        txModalStages.success(amount, token, txHash);
        return true;
      } catch (error) {
        console.error(error);
        txModalStages.failed(error, onRetry);
        return false;
      }
    },
    [
      approve,
      closeModal,
      gatherPermitSignature,
      getRequestMethod,
      isApprovalFlow,
      isBunker,
      isMultisig,
      needsApprove,
      onConfirm,
      onRetry,
      refetchAllowance,
      txModalStages,
      waitForTx,
    ],
  );

  return {
    isTokenLocked,
    isApprovalFlow,
    allowance,
    isApprovalFlowLoading,
    request,
  };
};
