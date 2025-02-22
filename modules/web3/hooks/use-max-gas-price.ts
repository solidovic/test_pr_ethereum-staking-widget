import { useFeeHistory } from 'wagmi';
import type { GetFeeHistoryReturnType } from 'viem';

import { useDappStatus } from './use-dapp-status';

const REWARD_PERCENTILES = [25];

const feeHistoryToMaxFee = ({
  reward,
  baseFeePerGas,
}: GetFeeHistoryReturnType) => {
  const maxPriorityFeePerGas = reward
    ? reward?.map((fees) => fees[0]).reduce((sum, fee) => sum + fee) /
      BigInt(reward.length)
    : 0n;

  const lastBaseFeePerGas = baseFeePerGas[0];

  // we have to multiply by 2 until we find a reliable way to predict baseFee change
  return lastBaseFeePerGas * 2n + maxPriorityFeePerGas;
};

export const useMaxGasPrice = (chainId?: number) => {
  const { chainId: dappChainId } = useDappStatus();

  const { data, isLoading, error, isFetching, refetch } = useFeeHistory({
    blockCount: 5,
    blockTag: 'pending',
    chainId: chainId || dappChainId,
    rewardPercentiles: REWARD_PERCENTILES,
    query: {
      select: feeHistoryToMaxFee,
    },
  });

  return {
    get maxGasPrice() {
      return data;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    get isFetching() {
      return isFetching;
    },
    update() {
      return refetch();
    },
  };
};
