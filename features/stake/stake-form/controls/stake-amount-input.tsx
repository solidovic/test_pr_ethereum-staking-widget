import { Eth } from '@lidofinance/lido-ui';
import { TokenAmountInputHookForm } from 'shared/hook-form/controls/token-amount-input-hook-form';
import { useStakeFormData } from '../stake-form-context';
import { useStakingLimitWarning } from 'shared/hooks/use-staking-limit-warning';

export const StakeAmountInput = () => {
  const { maxAmount, stakingLimitInfo } = useStakeFormData();
  const limitWarning = useStakingLimitWarning(
    stakingLimitInfo?.stakeLimitLevel,
  );
  return (
    <TokenAmountInputHookForm
      fieldName="amount"
      token={'ETH'}
      leftDecorator={<Eth />}
      maxValue={maxAmount}
      warning={limitWarning}
    />
  );
};
