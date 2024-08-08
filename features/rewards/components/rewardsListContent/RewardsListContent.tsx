import { FC } from 'react';
import { Loader, Divider } from '@lidofinance/lido-ui';
import { Zero } from '@ethersproject/constants';

import { useRewardsHistory } from 'features/rewards/hooks';
import { ErrorBlockNoSteth } from 'features/rewards/components/errorBlocks/ErrorBlockNoSteth';
import { RewardsTable } from 'features/rewards/components/rewardsTable';
import { useDappStatus } from 'shared/hooks/use-dapp-status';
import { useStethBalance } from 'shared/hooks/use-balance';

import { RewardsListsEmpty } from './RewardsListsEmpty';
import { RewardsListErrorMessage } from './RewardsListErrorMessage';
import {
  LoaderWrapper,
  TableWrapperStyle,
  ErrorWrapper,
} from './RewardsListContentStyles';

export const RewardsListContent: FC = () => {
  const { isDappActive } = useDappStatus();
  const {
    error,
    initialLoading,
    data,
    currencyObject,
    page,
    setPage,
    isLagging,
  } = useRewardsHistory();
  const { data: stethBalance, isLoading: isStethBalanceLoading } =
    useStethBalance();
  const hasSteth = stethBalance?.gt(Zero);

  if (!isDappActive || (!data && !initialLoading && !error))
    return <RewardsListsEmpty />;
  // showing loading when canceling requests and empty response
  if (
    (!data && !error) ||
    (initialLoading && !data?.events.length) ||
    isStethBalanceLoading
  ) {
    return (
      <>
        <Divider indents="lg" />
        <LoaderWrapper>
          <Loader />
        </LoaderWrapper>
      </>
    );
  }
  if (error) {
    return (
      <ErrorWrapper>
        <RewardsListErrorMessage error={error} />
      </ErrorWrapper>
    );
  }

  if (data && data.events.length === 0)
    return <ErrorBlockNoSteth hasSteth={hasSteth} />;

  return (
    <TableWrapperStyle data-testid="rewardsContent">
      {data?.events.length && !error && (
        <RewardsTable
          data={data.events}
          currency={currencyObject}
          totalItems={data.totalItems}
          page={page}
          setPage={setPage}
          pending={isLagging}
        />
      )}
    </TableWrapperStyle>
  );
};
