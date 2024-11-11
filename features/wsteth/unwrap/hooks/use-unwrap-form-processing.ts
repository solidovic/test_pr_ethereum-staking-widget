/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useCallback } from 'react';
import invariant from 'tiny-invariant';

import { TransactionCallbackStage } from '@lidofinance/lido-ethereum-sdk/core';

import { useLidoSDK, useDappStatus } from 'modules/web3';

import type { UnwrapFormInputType } from '../unwrap-form-context';
import { useUnwrapTxOnL2Approve } from './use-unwrap-tx-on-l2-approve';
import { useTxModalStagesUnwrap } from './use-tx-modal-stages-unwrap';

export type UnwrapFormApprovalData = ReturnType<typeof useUnwrapTxOnL2Approve>;

type UseUnwrapFormProcessorArgs = {
  approvalDataOnL2: UnwrapFormApprovalData;
  onConfirm: () => Promise<void>;
  onRetry?: () => void;
};

export const useUnwrapFormProcessor = ({
  approvalDataOnL2,
  onConfirm,
  onRetry,
}: UseUnwrapFormProcessorArgs) => {
  const { isDappActiveOnL2, address } = useDappStatus();
  const { txModalStages } = useTxModalStagesUnwrap();
  const { l2, stETH, wrap, isL2, shares } = useLidoSDK();

  const {
    isApprovalNeededBeforeUnwrap: isApprovalNeededBeforeUnwrapOnL2,
    processApproveTx: processApproveTxOnL2,
  } = approvalDataOnL2;

  const showSuccessTxModal = useCallback(
    async (txHash: `0x${string}`) => {
      const wstethBalance = await (isDappActiveOnL2
        ? l2.steth.balance(address)
        : stETH.balance(address));
      txModalStages.success(wstethBalance, txHash);
    },
    [address, isDappActiveOnL2, l2.steth, stETH, txModalStages],
  );

  return useCallback(
    async ({ amount }: UnwrapFormInputType) => {
      try {
        invariant(amount, 'amount should be presented');
        invariant(address, 'address should be presented');

        const willReceive = await (isDappActiveOnL2
          ? l2.steth.convertToSteth(amount)
          : shares.convertToSteth(amount));

        if (isL2 && isApprovalNeededBeforeUnwrapOnL2) {
          await processApproveTxOnL2({ onRetry });
        }

        if (isL2) {
          // The operation 'wstETH to stETH' on L2 is 'wrap'
          await l2.wrapWstethToSteth({
            value: amount,
            callback: ({ stage, payload }) => {
              switch (stage) {
                case TransactionCallbackStage.SIGN:
                  txModalStages.sign(amount, willReceive);
                  break;
                case TransactionCallbackStage.RECEIPT:
                  txModalStages.pending(amount, willReceive, payload);
                  break;
                case TransactionCallbackStage.CONFIRMATION:
                  void onConfirm?.();
                  void showSuccessTxModal(payload?.transactionHash);
                  break;
                case TransactionCallbackStage.MULTISIG_DONE:
                  txModalStages.successMultisig();
                  break;
                case TransactionCallbackStage.ERROR:
                  txModalStages.failed(payload, onRetry);
                  break;
                default:
              }
            },
          });
        } else {
          await wrap.unwrap({
            value: amount,
            callback: ({ stage, payload }) => {
              switch (stage) {
                case TransactionCallbackStage.SIGN:
                  txModalStages.sign(amount, willReceive);
                  break;
                case TransactionCallbackStage.RECEIPT:
                  txModalStages.pending(amount, willReceive, payload);
                  break;
                case TransactionCallbackStage.CONFIRMATION:
                  void onConfirm?.();
                  void showSuccessTxModal(payload?.transactionHash);
                  break;
                case TransactionCallbackStage.MULTISIG_DONE:
                  txModalStages.successMultisig();
                  break;
                case TransactionCallbackStage.ERROR:
                  txModalStages.failed(payload, onRetry);
                  break;
                default:
              }
            },
          });
        }

        return true;
      } catch (error: any) {
        console.warn(error);
        txModalStages.failed(error, onRetry);
        return false;
      }
    },
    [
      address,
      isDappActiveOnL2,
      l2,
      shares,
      isL2,
      isApprovalNeededBeforeUnwrapOnL2,
      processApproveTxOnL2,
      onRetry,
      txModalStages,
      onConfirm,
      showSuccessTxModal,
      wrap,
    ],
  );
};
