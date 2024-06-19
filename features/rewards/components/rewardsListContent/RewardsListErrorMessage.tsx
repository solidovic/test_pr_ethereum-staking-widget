import { ErrorBlockBase } from '../errorBlocks/ErrorBlockBase';
import { ErrorBlockServer } from '../errorBlocks/ErrorBlockServer';
import { ErrorRateLimited } from '../errorBlocks/ErrorRateLimited';

import { extractErrorMessage } from 'utils';
import { FetcherError } from 'utils/fetcherError';

type Props = {
  error: unknown;
};

export const RewardsListErrorMessage: React.FC<Props> = ({ error }) => {
  const errorMessage = extractErrorMessage(error);

  if (error instanceof FetcherError && error.status === 503) {
    return <ErrorBlockServer />;
  }

  if (error instanceof FetcherError && error.status === 429) {
    return <ErrorRateLimited />;
  }

  return <ErrorBlockBase text={errorMessage} />;
};
