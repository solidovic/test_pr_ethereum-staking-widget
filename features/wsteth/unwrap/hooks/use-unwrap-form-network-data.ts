import { useCallback, useMemo } from 'react';
import { useStethBalance, useWstethBalance, useIsMultisig } from 'modules/web3';

export const useUnwrapFormNetworkData = () => {
  const { isMultisig } = useIsMultisig();
  const { data: stethBalance, refetch: stethBalanceUpdate } = useStethBalance();
  const { data: wstethBalance, refetch: wstethBalanceUpdate } =
    useWstethBalance();

  const revalidateUnwrapFormData = useCallback(async () => {
    await Promise.allSettled([stethBalanceUpdate(), wstethBalanceUpdate()]);
  }, [stethBalanceUpdate, wstethBalanceUpdate]);

  const networkData = useMemo(
    () => ({
      isMultisig,
      stethBalance,
      wstethBalance,
      revalidateUnwrapFormData,
      maxAmount: wstethBalance,
    }),
    [isMultisig, stethBalance, wstethBalance, revalidateUnwrapFormData],
  );

  return networkData;
};
