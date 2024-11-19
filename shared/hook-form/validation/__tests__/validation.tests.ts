/* eslint-disable unicorn/consistent-function-scoping */
import { LIDO_TOKENS } from '@lidofinance/lido-ethereum-sdk/common';

import { MAX_UINT_256 } from '../../../../modules/web3';
import { validateBigintMax } from '../validate-bigint-max';
import { validateBigintMin } from '../validate-bigint-min';
import { validateEtherAmount } from '../validate-ether-amount';
import { DefaultValidationErrorTypes } from '../validation-error';

const message = 'test_message';
const field = 'test_field';

describe('validateBigintMax', () => {
  it('should work', () => {
    validateBigintMax(field, BigInt(10), BigInt(12), message);
    validateBigintMax(field, BigInt(12), BigInt(12), message);
  });

  it('should throw right error', () => {
    const fn = () => validateBigintMax(field, BigInt(12), BigInt(10), message);
    expect(fn).toThrowError();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        message,
        type: DefaultValidationErrorTypes.VALIDATE,
      });
    }
  });
});

describe('validateBigintMin', () => {
  it('should work', () => {
    validateBigintMin(field, BigInt(12), BigInt(10), message);
    validateBigintMin(field, BigInt(12), BigInt(12), message);
  });

  it('should throw right error', () => {
    const fn = () => validateBigintMin(field, BigInt(10), BigInt(12), message);
    expect(fn).toThrowError();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        message,
        type: DefaultValidationErrorTypes.VALIDATE,
      });
    }
  });
});

describe('validateEtherAmount', () => {
  it('should work', () => {
    validateEtherAmount(field, BigInt(12), LIDO_TOKENS.steth);
  });

  it('should throw right error on null amount', () => {
    const fn = () => validateEtherAmount(field, undefined, LIDO_TOKENS.steth);
    expect(fn).toThrowError();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        type: DefaultValidationErrorTypes.VALIDATE,
      });
    }
  });

  it('should throw right error on zero', () => {
    const fn = () => validateEtherAmount(field, BigInt(0), LIDO_TOKENS.steth);
    expect(fn).toThrowError();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        type: DefaultValidationErrorTypes.VALIDATE,
      });
    }
  });

  it('should throw right error on more than ethereum max uint', () => {
    const fn = () =>
      validateEtherAmount(field, MAX_UINT_256 + BigInt(1), LIDO_TOKENS.steth);
    expect(fn).toThrowError();
    try {
      fn();
    } catch (e) {
      expect(e).toMatchObject({
        field,
        type: DefaultValidationErrorTypes.VALIDATE,
      });
    }
  });
});
