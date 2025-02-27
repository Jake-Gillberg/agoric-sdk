// @jessie-check

import { AmountMath, AssetKind } from '@agoric/ertp';
import { makeRatio } from '@agoric/zoe/src/contractSupport/index.js';
import { deeplyFulfilledObject } from '@agoric/internal';
import { Stable } from '@agoric/vats/src/tokens.js';
import { E } from '@endo/far';
import { parseRatio } from '@agoric/zoe/src/contractSupport/ratio.js';
import { reserveThenGetNames } from './utils.js';

export * from './startPSM.js';

/**
 * @typedef {object} InterchainAssetOptions
 * @property {string} [issuerBoardId]
 * @property {string} [denom]
 * @property {number} [decimalPlaces]
 * @property {string} [proposedName]
 * @property {string} keyword
 * @property {string} oracleBrand
 * @property {number} [initialPrice]
 */

/**
 * @param {EconomyBootstrapPowers} powers
 * @param {object} config
 * @param {object} config.options
 * @param {InterchainAssetOptions} config.options.interchainAssetOptions
 */
export const publishInterchainAssetFromBoardId = async (
  { consume: { board, agoricNamesAdmin } },
  { options: { interchainAssetOptions } },
) => {
  const { issuerBoardId, keyword } = interchainAssetOptions;
  // Incompatible with denom.
  assert.equal(interchainAssetOptions.denom, undefined);
  assert.typeof(issuerBoardId, 'string');
  assert.typeof(keyword, 'string');

  const issuer = await E(board).getValue(issuerBoardId);
  const brand = await E(issuer).getBrand();

  return Promise.all([
    E(E(agoricNamesAdmin).lookupAdmin('issuer')).update(keyword, issuer),
    E(E(agoricNamesAdmin).lookupAdmin('brand')).update(keyword, brand),
  ]);
};

/**
 * @param {EconomyBootstrapPowers} powers
 * @param {object} config
 * @param {object} config.options
 * @param {InterchainAssetOptions} config.options.interchainAssetOptions
 */
export const publishInterchainAssetFromBank = async (
  {
    consume: {
      bankManager,
      agoricNamesAdmin,
      bankMints,
      vBankKits,
      reserveKit,
      startUpgradable: startUpgradableP,
    },
    produce: { bankMints: produceBankMints, vBankKits: produceVBankKits },
    installation: {
      consume: { mintHolder },
    },
  },
  { options: { interchainAssetOptions } },
) => {
  const { denom, decimalPlaces, proposedName, keyword } =
    interchainAssetOptions;

  // Incompatible with issuerBoardId.
  assert.equal(interchainAssetOptions.issuerBoardId, undefined);
  assert.typeof(denom, 'string');
  assert.typeof(keyword, 'string');
  assert.typeof(decimalPlaces, 'number');
  assert.typeof(proposedName, 'string');

  const terms = {
    keyword,
    assetKind: AssetKind.NAT,
    displayInfo: {
      decimalPlaces,
      assetKind: AssetKind.NAT,
    },
  };

  const startUpgradable = await startUpgradableP;
  produceVBankKits.resolve([]);
  const { creatorFacet: mint, publicFacet: issuer } = await startUpgradable({
    installation: mintHolder,
    label: keyword,
    privateArgs: undefined,
    terms,
    produceResults: {
      resolve: kit => Promise.resolve(vBankKits).then(kits => kits.push(kit)),
    },
  });

  const brand = await E(issuer).getBrand();
  const kit = { mint, issuer, brand };

  await E(E.get(reserveKit).creatorFacet).addIssuer(issuer, keyword);

  // Create the mint list if it doesn't exist and wasn't already rejected.
  produceBankMints.resolve([]);
  await Promise.all([
    Promise.resolve(bankMints).then(
      mints => mints.push(mint),
      () => {}, // If the bankMints list was rejected, ignore the error.
    ),
    E(E(agoricNamesAdmin).lookupAdmin('issuer')).update(keyword, issuer),
    E(E(agoricNamesAdmin).lookupAdmin('brand')).update(keyword, brand),
    E(bankManager).addAsset(denom, keyword, proposedName, kit),
  ]);
};

/**
 * @param {BootstrapPowers} powers
 * @param {object} config
 * @param {object} config.options
 * @param {InterchainAssetOptions} config.options.interchainAssetOptions
 */
export const registerScaledPriceAuthority = async (
  {
    consume: {
      agoricNamesAdmin,
      startUpgradable: startUpgradableP,
      priceAuthorityAdmin,
      priceAuthority,
      scaledPriceAuthorityKits,
    },
    produce: { scaledPriceAuthorityKits: produceScaledPriceAuthorityKits },
  },
  { options: { interchainAssetOptions } },
) => {
  const {
    keyword,
    oracleBrand,
    initialPrice: initialPriceRaw,
  } = interchainAssetOptions;
  assert.typeof(keyword, 'string');
  assert.typeof(oracleBrand, 'string');

  const [
    sourcePriceAuthority,
    [interchainBrand, runBrand],
    [interchainOracleBrand, usdBrand],
    [scaledPriceAuthority],
  ] = await Promise.all([
    priceAuthority,
    reserveThenGetNames(E(agoricNamesAdmin).lookupAdmin('brand'), [
      keyword,
      'IST',
    ]),
    reserveThenGetNames(E(agoricNamesAdmin).lookupAdmin('oracleBrand'), [
      oracleBrand,
      'USD',
    ]),
    reserveThenGetNames(E(agoricNamesAdmin).lookupAdmin('installation'), [
      'scaledPriceAuthority',
    ]),
  ]);

  // We need "unit amounts" of each brand in order to get the ratios right.  You
  // can ignore decimalPlaces when adding and subtracting a brand with itself,
  // but not when creating ratios.
  const getDecimalP = async brand => {
    const displayInfo = E(brand).getDisplayInfo();
    return E.get(displayInfo).decimalPlaces;
  };
  const [
    decimalPlacesInterchainOracle = 0,
    decimalPlacesInterchain = 0,
    decimalPlacesUsd = 0,
    decimalPlacesRun = 0,
  ] = await Promise.all([
    getDecimalP(interchainOracleBrand),
    getDecimalP(interchainBrand),
    getDecimalP(usdBrand),
    getDecimalP(runBrand),
  ]);

  const scaleIn = makeRatio(
    10n ** BigInt(decimalPlacesInterchainOracle),
    interchainOracleBrand,
    10n ** BigInt(decimalPlacesInterchain),
    interchainBrand,
  );
  const scaleOut = makeRatio(
    10n ** BigInt(decimalPlacesUsd),
    usdBrand,
    10n ** BigInt(decimalPlacesRun),
    runBrand,
  );
  const initialPrice = initialPriceRaw
    ? parseRatio(initialPriceRaw, runBrand, interchainBrand)
    : undefined;

  const terms = await deeplyFulfilledObject(
    harden({
      sourcePriceAuthority,
      scaleIn,
      scaleOut,
      initialPrice,
    }),
  );

  const startUpgradable = await startUpgradableP;
  produceScaledPriceAuthorityKits.resolve([]);
  const spaKit = await startUpgradable({
    installation: scaledPriceAuthority,
    label: `scaledPriceAuthority-${keyword}`,
    terms,
    produceResults: {
      resolve: kit =>
        Promise.resolve(scaledPriceAuthorityKits).then(kits => kits.push(kit)),
    },
    privateArgs: undefined,
  });

  await E(priceAuthorityAdmin).registerPriceAuthority(
    // @ts-expect-error The public facet should have getPriceAuthority
    E(spaKit.publicFacet).getPriceAuthority(),
    interchainBrand,
    runBrand,
    true, // force
  );
};

/** @typedef {import('./econ-behaviors.js').EconomyBootstrapPowers} EconomyBootstrapPowers */

/**
 * @param {EconomyBootstrapPowers} powers
 * @param {object} config
 * @param {object} config.options
 * @param {InterchainAssetOptions} config.options.interchainAssetOptions
 * @param {bigint} config.options.debtLimitValue
 * @param {bigint} config.options.interestRateValue
 */
export const addAssetToVault = async (
  {
    consume: { vaultFactoryKit, agoricNamesAdmin, auctioneerKit },
    brand: {
      consume: { [Stable.symbol]: stableP },
    },
  },
  {
    options: {
      // Default to 1000 IST to simplify testing. A production proposal will set this.
      debtLimitValue = 1_000n * 1_000_000n,
      // Default to a safe value. Production will likely set this through governance.
      // Allow setting through bootstrap to simplify testing.
      interestRateValue = 1n,
      interchainAssetOptions,
    },
  },
) => {
  const { keyword, oracleBrand } = interchainAssetOptions;
  assert.typeof(keyword, 'string');
  assert.typeof(oracleBrand, 'string');
  const [interchainIssuer] = await reserveThenGetNames(
    E(agoricNamesAdmin).lookupAdmin('issuer'),
    [keyword],
  );

  const stable = await stableP;
  const vaultFactoryCreator = E.get(vaultFactoryKit).creatorFacet;
  await E(vaultFactoryCreator).addVaultType(interchainIssuer, oracleBrand, {
    debtLimit: AmountMath.make(stable, debtLimitValue),
    interestRate: makeRatio(interestRateValue, stable),
    // The rest of these we use safe defaults.
    // In production they will be governed by the Econ Committee.
    // Product deployments are also expected to have a low debtLimitValue at the outset,
    // limiting the impact of these defaults.
    liquidationPadding: makeRatio(25n, stable),
    liquidationMargin: makeRatio(150n, stable),
    mintFee: makeRatio(50n, stable, 10_000n),
    liquidationPenalty: makeRatio(1n, stable),
  });
  const auctioneerCreator = E.get(auctioneerKit).creatorFacet;
  await E(auctioneerCreator).addBrand(interchainIssuer, keyword);
};

export const getManifestForAddAssetToVault = (
  { restoreRef },
  {
    debtLimitValue,
    interestRateValue,
    interchainAssetOptions,
    scaledPriceAuthorityRef,
  },
) => {
  const publishIssuerFromBoardId =
    typeof interchainAssetOptions.issuerBoardId === 'string';
  const publishIssuerFromBank =
    !publishIssuerFromBoardId &&
    typeof interchainAssetOptions.denom === 'string';
  return {
    manifest: {
      ...(publishIssuerFromBoardId && {
        [publishInterchainAssetFromBoardId.name]: {
          consume: {
            board: true,
            agoricNamesAdmin: true,
          },
        },
      }),
      ...(publishIssuerFromBank && {
        [publishInterchainAssetFromBank.name]: {
          consume: {
            bankManager: true,
            agoricNamesAdmin: true,
            bankMints: true,
            reserveKit: true,
            vBankKits: true,
            startUpgradable: true,
          },
          produce: { bankMints: true, vBankKits: true },
          installation: {
            consume: { mintHolder: true },
          },
        },
      }),
      [registerScaledPriceAuthority.name]: {
        consume: {
          agoricNamesAdmin: true,
          startUpgradable: true,
          priceAuthorityAdmin: true,
          priceAuthority: true,
          scaledPriceAuthorityKits: true,
        },
        produce: {
          scaledPriceAuthorityKits: true,
        },
        installation: {
          consume: { scaledPriceAuthority: true },
        },
      },
      [addAssetToVault.name]: {
        consume: {
          auctioneerKit: 'auctioneer',
          vaultFactoryKit: 'vaultFactory',
          agoricNamesAdmin: true,
        },
        brand: {
          consume: { [Stable.symbol]: true },
        },
      },
    },
    installations: {
      scaledPriceAuthority: restoreRef(scaledPriceAuthorityRef),
    },
    options: {
      debtLimitValue,
      interchainAssetOptions,
      interestRateValue,
    },
  };
};
