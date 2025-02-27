import { test } from '@agoric/zoe/tools/prepare-test-env-ava.js';

import { TimeMath } from '@agoric/time';
import { Far } from '@endo/marshal';
import '@agoric/zoe/exported.js';

import {
  computeRoundTiming,
  nextDescendingStepTime,
} from '../../src/auction/scheduleMath.js';

const makeDefaultParams = ({
  freq = 3600,
  step = 600,
  delay = 300,
  discount = 1000n,
  lock = 15 * 60,
  lowest = 6_500n,
} = {}) => {
  /** @type {import('@agoric/time').TimerBrand} */
  const timerBrand = Far('timerBrand');

  return {
    getStartFrequency: () =>
      TimeMath.coerceRelativeTimeRecord(freq, timerBrand),
    getClockStep: () => TimeMath.coerceRelativeTimeRecord(step, timerBrand),
    getStartingRate: () => 10_500n,
    getDiscountStep: () => discount,
    getPriceLockPeriod: () =>
      TimeMath.coerceRelativeTimeRecord(lock, timerBrand),
    getLowestRate: () => lowest,
    getAuctionStartDelay: () =>
      TimeMath.coerceRelativeTimeRecord(delay, timerBrand),
  };
};

/**
 * @param {any} t
 * @param {ReturnType<makeDefaultParams>} params
 * @param {number} baseTime
 * @param {any} rawExpect
 */
const checkSchedule = (t, params, baseTime, rawExpect) => {
  /** @type {import('@agoric/time/src/types').TimestampRecord} */
  // @ts-expect-error known for testing
  const startFrequency = params.getStartFrequency();
  const brand = startFrequency.timerBrand;
  const schedule = computeRoundTiming(
    params,
    TimeMath.coerceTimestampRecord(baseTime, brand),
  );

  const expect = {
    startTime: TimeMath.coerceTimestampRecord(rawExpect.startTime, brand),
    endTime: TimeMath.coerceTimestampRecord(rawExpect.endTime, brand),
    steps: rawExpect.steps,
    endRate: rawExpect.endRate,
    startDelay: TimeMath.coerceRelativeTimeRecord(rawExpect.startDelay, brand),
    clockStep: TimeMath.coerceRelativeTimeRecord(rawExpect.clockStep, brand),
    lockTime: TimeMath.coerceTimestampRecord(rawExpect.lockTime, brand),
  };
  t.deepEqual(schedule, expect);
};

/**
 * @param {any} t
 * @param {ReturnType<makeDefaultParams>} params
 * @param {number} baseTime
 * @param {any} expectMessage  XXX should be {ThrowsExpectation}
 */
const checkScheduleThrows = (t, params, baseTime, expectMessage) => {
  /** @type {import('@agoric/time/src/types').TimestampRecord} */
  // @ts-expect-error known for testing
  const startFrequency = params.getStartFrequency();
  const brand = startFrequency.timerBrand;
  const baseTimeRecord = TimeMath.coerceTimestampRecord(baseTime, brand);
  t.throws(() => computeRoundTiming(params, baseTimeRecord), {
    message: expectMessage,
  });
};

// Hourly starts. 4 steps down, 5 price levels. discount steps of 10%.
// 10.5, 9.5, 8.5, 7.5, 6.5. First start is 5 minutes after the hour.
test('simple schedule', checkSchedule, makeDefaultParams(), 100, {
  startTime: 3600 + 300,
  endTime: 3600 + 4 * 10 * 60 + 300,
  steps: 4n,
  endRate: 6_500n,
  startDelay: 300,
  clockStep: 600,
  lockTime: 3000,
});

test(
  'baseTime at a possible start',
  checkSchedule,
  makeDefaultParams({}),
  3600,
  {
    startTime: 7200 + 300,
    endTime: 7200 + 4 * 10 * 60 + 300,
    steps: 4n,
    endRate: 6_500n,
    startDelay: 300,
    clockStep: 600,
    lockTime: 6600,
  },
);

// Hourly starts. 8 steps down, 9 price levels. discount steps of 5%.
// First start is 5 minutes after the hour.
test(
  'finer steps',
  checkSchedule,
  makeDefaultParams({ step: 300, discount: 500n }),
  100,
  {
    startTime: 3600 + 300,
    endTime: 3600 + 8 * 5 * 60 + 300,
    steps: 8n,
    endRate: 6_500n,
    startDelay: 300,
    clockStep: 300,
    lockTime: 3000,
  },
);

// lock Period too Long
test(
  'long lock period',
  checkScheduleThrows,
  makeDefaultParams({ lock: 3600 }),
  100,
  /startFrequency must exceed lock period/,
);

test(
  'longer auction than freq',
  checkScheduleThrows,
  makeDefaultParams({ freq: 500, lock: 300 }),
  100,
  /clockStep .* must be shorter than startFrequency /,
);

test(
  'startDelay too long',
  checkScheduleThrows,
  makeDefaultParams({ delay: 5000 }),
  100,
  /startFrequency must exceed startDelay/,
);

test(
  'large discount step',
  checkScheduleThrows,
  makeDefaultParams({ discount: 5000n }),
  100,
  /discountStep "\[5000n]" too large for requested rates/,
);

test(
  'one auction step',
  checkSchedule,
  makeDefaultParams({ discount: 2001n }),
  100,
  {
    startTime: 3600 + 300,
    endTime: 3600 + 600 + 300,
    steps: 1n,
    endRate: 10_500n - 2_001n,
    startDelay: 300,
    clockStep: 600,
    lockTime: 3000,
  },
);

test(
  'lowest rate higher than start',
  checkScheduleThrows,
  makeDefaultParams({ lowest: 10_600n }),
  100,
  /startingRate "\[10500n]" must be more than/,
);

// If the steps are small enough that we can't get to the end_rate, we'll cut
// the auction short when the next auction should start.
test(
  'very small discountStep',
  checkSchedule,
  makeDefaultParams({ discount: 10n }),
  100,
  {
    startTime: 3600 + 300,
    endTime: 3600 + 5 * 10 * 60 + 300,
    steps: 5n,
    endRate: 10_500n - 5n * 10n,
    startDelay: 300,
    clockStep: 600,
    lockTime: 3000,
  },
);

// if the discountStep is not a divisor of the price range, we'll end above the
// specified lowestRate.
test(
  'discountStep not a divisor of price range',
  checkSchedule,
  makeDefaultParams({ discount: 350n }),
  100,
  {
    startTime: 3600 + 300,
    endTime: 3600 + 5 * 10 * 60 + 300,
    steps: 5n,
    endRate: 10_500n - 5n * 350n,
    startDelay: 300,
    clockStep: 600,
    lockTime: 3000,
  },
);

const TWO_PM = 1680876000n;
const FIVE_MINUTES = 5n * 60n;
const FIFTEEN_MINUTES = 15n * 60n;
const defaults = makeDefaultParams();
const TWO_PM_SCHED = computeRoundTiming(defaults, TWO_PM - 1n);
const THREE_PM_SCHED = computeRoundTiming(defaults, TWO_PM);

const checkDescendingStep = (t, liveSchedule, nextSchedule, now, expected) => {
  const brand = nextSchedule.startTime.timerBrand;

  const nowTime = TimeMath.coerceTimestampRecord(now, brand);
  t.deepEqual(
    nextDescendingStepTime(liveSchedule, nextSchedule, nowTime),
    TimeMath.coerceTimestampRecord(expected, brand),
  );
};

test(
  'descendingSteps at start time',
  checkDescendingStep,
  TWO_PM_SCHED,
  THREE_PM_SCHED,
  TWO_PM,
  TWO_PM + FIVE_MINUTES,
);

test(
  'descendingSteps before start time',
  checkDescendingStep,
  TWO_PM_SCHED,
  THREE_PM_SCHED,
  TWO_PM - 1n,
  TWO_PM + FIVE_MINUTES,
);

test(
  'descendingSteps at first step',
  checkDescendingStep,
  TWO_PM_SCHED,
  THREE_PM_SCHED,
  TWO_PM + FIVE_MINUTES,
  TWO_PM + FIFTEEN_MINUTES,
);

test(
  'descendingSteps after first step start',
  checkDescendingStep,
  TWO_PM_SCHED,
  THREE_PM_SCHED,
  TWO_PM + FIVE_MINUTES + 1n,
  TWO_PM + FIFTEEN_MINUTES,
);

test(
  'descendingSteps at last step',
  checkDescendingStep,
  TWO_PM_SCHED,
  THREE_PM_SCHED,
  TWO_PM + 45n * 60n,
  TWO_PM + 60n * 60n + FIVE_MINUTES,
);

test(
  'descendingSteps between auctions',
  checkDescendingStep,
  undefined,
  THREE_PM_SCHED,
  TWO_PM + 45n * 60n + 1n,
  TWO_PM + 60n * 60n + FIVE_MINUTES,
);
