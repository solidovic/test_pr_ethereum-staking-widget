import { useFormState } from 'react-hook-form';
import { Button } from '@lidofinance/lido-ui';

import { Connect, DisabledButton } from 'shared/wallet';
import { FormatToken } from 'shared/formatters/format-token';
import { isValidationErrorTypeUnhandled } from 'shared/hook-form/validation/validation-error';

import { ZERO, useDappStatus } from 'modules/web3';

import { ClaimFormInputType, useClaimFormData } from '../claim-form-context';

export const SubmitButton = () => {
  const { isSupportedChain, isWalletConnected } = useDappStatus();

  const { isSubmitting, isValidating, errors } =
    useFormState<ClaimFormInputType>();
  const { ethToClaim } = useClaimFormData();
  const { selectedRequests } = useClaimFormData();

  if (!isWalletConnected) return <Connect fullwidth />;

  if (!isSupportedChain) {
    return <DisabledButton>Claim</DisabledButton>;
  }

  const disabled =
    (!!errors.requests &&
      !isValidationErrorTypeUnhandled(errors.requests.type)) ||
    selectedRequests.length === 0;

  const claimButtonAmount =
    ethToClaim <= ZERO ? null : (
      <FormatToken showAmountTip={false} amount={ethToClaim} symbol="ETH" />
    );

  return (
    <Button
      data-testid="claimButton"
      fullwidth
      disabled={disabled}
      loading={isSubmitting || isValidating}
      type="submit"
    >
      Claim {claimButtonAmount}
    </Button>
  );
};
