// @jessie-check

import { AmountMath } from '@agoric/ertp';
import { makeStoredPublisherKit, makeStoredPublishKit } from '@agoric/notifier';
import { M } from '@agoric/store';
import { E } from '@endo/eventual-send';

const { Fail, quote: q } = assert;

export const amountPattern = harden({ brand: M.remotable(), value: M.any() });
export const ratioPattern = harden({
  numerator: amountPattern,
  denominator: amountPattern,
});

/**
 * Apply a delta to the `base` Amount, where the delta is represented as
 * an amount to gain and an amount to lose. Typically one of those will
 * be empty because gain/loss comes from the give/want for a specific asset
 * on a proposal. We use two Amounts because an Amount cannot represent
 * a negative number (so we use a "loss" that will be subtracted).
 *
 * @template {AssetKind} K
 * @param {Amount<K>} base
 * @param {Amount<K>} gain
 * @param {Amount<K>} loss
 * @returns {Amount<K>}
 */
export const addSubtract = (base, gain, loss) =>
  AmountMath.subtract(AmountMath.add(base, gain), loss);

/**
 * Verifies that every key in the proposal is in the provided list
 *
 * @param {ProposalRecord} proposal
 * @param {string[]} keys
 */
export const assertOnlyKeys = (proposal, keys) => {
  /** @param {AmountKeywordRecord} clause */
  const onlyKeys = clause =>
    Object.getOwnPropertyNames(clause).every(c => keys.includes(c));
  onlyKeys(proposal.give) || Fail`extraneous terms in give: ${proposal.give}`;
  onlyKeys(proposal.want) || Fail`extraneous terms in want: ${proposal.want}`;
};

/**
 * @param {Amount[]} amounts
 * @returns {boolean}
 */
export const allEmpty = amounts => {
  return amounts.every(a => AmountMath.isEmpty(a));
};

/**
 * @param {Amount<'nat'>} debtLimit
 * @param {Amount<'nat'>} totalDebt
 * @param {Amount<'nat'>} toMint
 * @throws if minting would exceed total debt
 */
export const checkDebtLimit = (debtLimit, totalDebt, toMint) => {
  const debtPost = AmountMath.add(totalDebt, toMint);
  AmountMath.isGTE(debtLimit, debtPost) ||
    Fail`Minting ${q(toMint)} past ${q(
      totalDebt,
    )} would hit total debt limit ${q(debtLimit)}`;
};

/**
 * @deprecated incompatible with durability; instead handle vstorage ephemerally on a durable PublishKit
 * @template T
 * @param {ERef<StorageNode>} storageNode
 * @param {ERef<Marshaller>} marshaller
 * @returns {MetricsPublisherKit<T>}
 */
export const makeMetricsPublisherKit = (storageNode, marshaller) => {
  assert(
    storageNode && marshaller,
    'makeMetricsPublisherKit missing storageNode or marshaller',
  );
  /** @type {import('@agoric/notifier').StoredPublisherKit<T>} */
  const kit = makeStoredPublisherKit(storageNode, marshaller, 'metrics');
  return {
    metricsPublication: kit.publisher,
    metricsSubscription: kit.subscriber,
  };
};
harden(makeMetricsPublisherKit);

/**
 * @template T
 * @typedef {object} MetricsPublisherKit<T>
 * @property {IterationObserver<T>} metricsPublication
 * @property {StoredSubscription<T>} metricsSubscription
 */

/**
 * @template T
 * @typedef {object} MetricsPublishKit<T>
 * @property {Publisher<T>} metricsPublisher
 * @property {StoredSubscriber<T>} metricsSubscriber
 */

/**
 * @deprecated incompatible with durability; instead handle vstorage ephemerally on a durable PublishKit
 * @template T
 * @param {ERef<StorageNode>} storageNode
 * @param {ERef<Marshaller>} marshaller
 * @returns {MetricsPublishKit<T>}
 */
export const makeMetricsPublishKit = (storageNode, marshaller) => {
  assert(
    storageNode && marshaller,
    'makeMetricsPublisherKit missing storageNode or marshaller',
  );
  const metricsNode = E(storageNode).makeChildNode('metrics');
  /** @type {StoredPublishKit<T>} */
  const kit = makeStoredPublishKit(metricsNode, marshaller);
  return {
    metricsPublisher: kit.publisher,
    metricsSubscriber: kit.subscriber,
  };
};
harden(makeMetricsPublishKit);

/**
 * @param {Brand} brand must be a 'nat' brand, not checked
 * @param {NatValue} [min]
 */
export const makeNatAmountShape = (brand, min) =>
  harden({ brand, value: min ? M.gte(min) : M.nat() });
