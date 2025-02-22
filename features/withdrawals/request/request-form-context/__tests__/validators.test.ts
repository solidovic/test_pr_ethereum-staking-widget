/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-conditional-expect */
import { TvlErrorPayload, __test__export } from '../validators';
const {
  ValidationSplitRequest,
  ValidationTvlJoke,
  tvlJokeValidate,
  validateSplitRequests,
} = __test__export;

const field = 'test_field';
const balance = 5n;

describe('tvlJokeValidate', () => {
  it('should work', () => {
    tvlJokeValidate(field, 10n, 12n, balance);
  });

  it('should throw right error', () => {
    const value = 20n;
    const tvl = 10n;
    const fn = () => tvlJokeValidate(field, value, tvl, balance);
    expect(fn).toThrow();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        type: ValidationTvlJoke.type,
      });
      expect(e).toHaveProperty('payload.balanceDiffSteth');
      expect(
        value - balance ===
          (e as { payload: TvlErrorPayload }).payload.balanceDiffSteth,
      ).toBe(true);

      expect(e).toHaveProperty('payload.tvlDiff');
      expect(
        value - tvl === (e as { payload: TvlErrorPayload }).payload.tvlDiff,
      ).toBe(true);
    }
  });
});

const maxAmountPerRequest = 100n;
const minAmountPerRequest = 10n;
const maxRequestCount = 100;

describe('validateSplitRequests', () => {
  it('should split into 1 request', () => {
    const requests = validateSplitRequests(
      field,
      10n,
      maxAmountPerRequest,
      minAmountPerRequest,
      maxRequestCount,
    );
    expect(requests).toHaveLength(1);
    expect(requests[0] === 10n).toBe(true);
  });

  it('should split into 2 requests', () => {
    const amount = maxAmountPerRequest + minAmountPerRequest * 5n;
    const requests = validateSplitRequests(
      field,
      amount,
      maxAmountPerRequest,
      minAmountPerRequest,
      maxRequestCount,
    );
    expect(requests).toHaveLength(2);
    expect(requests[0] === maxAmountPerRequest).toBe(true);
    expect(requests[1] === amount - maxAmountPerRequest).toBe(true);
  });

  it('should split into 2(max+min) requests', () => {
    const requests = validateSplitRequests(
      field,
      maxAmountPerRequest + minAmountPerRequest,
      maxAmountPerRequest,
      minAmountPerRequest,
      maxRequestCount,
    );
    expect(requests).toHaveLength(2);
    expect(requests[0] === maxAmountPerRequest).toBe(true);
    expect(requests[1] === minAmountPerRequest).toBe(true);
  });

  it('should split into max requests', () => {
    const requests = validateSplitRequests(
      field,
      maxAmountPerRequest * BigInt(maxRequestCount),
      maxAmountPerRequest,
      minAmountPerRequest,
      maxRequestCount,
    );
    expect(requests).toHaveLength(maxRequestCount);
    requests.forEach((r) => {
      expect(r === maxAmountPerRequest).toBe(true);
    });
  });

  it('should throw right error when more than max', () => {
    const fn = () =>
      validateSplitRequests(
        field,
        maxAmountPerRequest * BigInt(maxRequestCount) + 1n,
        maxAmountPerRequest,
        minAmountPerRequest,
        maxRequestCount,
      );
    expect(fn).toThrow();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        type: ValidationSplitRequest.type,
      });
      expect(e).toHaveProperty('payload.requestCount');
      expect((e as any).payload.requestCount).toBe(maxRequestCount + 1);
    }
  });

  it('should throw right error when cannot split because of left over', () => {
    const fn = () =>
      validateSplitRequests(
        field,
        maxAmountPerRequest + minAmountPerRequest - 1n,
        maxAmountPerRequest,
        minAmountPerRequest,
        maxRequestCount,
      );
    expect(fn).toThrow();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        type: ValidationSplitRequest.type,
      });
    }
  });
});
