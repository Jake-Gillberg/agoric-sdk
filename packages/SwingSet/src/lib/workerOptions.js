/**
 * @param {string} managerType
 * @param {import("../controller/bundle-handler").BundleHandler} bundleHandler
 * @returns {Promise<import("../types-internal").WorkerOptions>}
 */
export async function makeWorkerOptions(managerType, bundleHandler) {
  if (managerType === 'local') {
    return harden({ type: 'local' });
  } else if (managerType === 'xsnap' || managerType === 'xs-worker') {
    // eslint-disable-next-line @jessie.js/no-nested-await, no-await-in-loop
    const bundleIDs = await bundleHandler.getCurrentBundleIDs();
    return harden({ type: 'xsnap', bundleIDs });
  }
  throw Error(`unknown managerType '${managerType}'`);
}

/**
 * @param {import("../types-internal").WorkerOptions} origWorkerOptions
 * @param {{bundleHandler: import("../controller/bundle-handler").BundleHandler}} options
 * @returns {Promise<import("../types-internal").WorkerOptions>}
 */
export async function updateWorkerOptions(
  origWorkerOptions,
  { bundleHandler },
) {
  const { type } = origWorkerOptions;
  if (type === 'local') {
    return origWorkerOptions;
  } else if (type === 'xsnap') {
    // eslint-disable-next-line @jessie.js/no-nested-await, no-await-in-loop
    const bundleIDs = await bundleHandler.getCurrentBundleIDs();
    return harden({ ...origWorkerOptions, bundleIDs });
  }
  throw Error(`unknown worker type '${type}'`);
}
