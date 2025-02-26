import '@endo/init/debug.js';
import test from 'ava';
import fs from 'fs';
import crypto from 'crypto';

import {
  getSupervisorBundle,
  getSupervisorBundleSHA256,
} from '../src/index.js';
import { bundlePaths } from '../src/paths.js';

test('getSupervisorBundle', async t => {
  const bundle = await getSupervisorBundle();
  t.is(typeof bundle, 'object');
  t.is(bundle.moduleFormat, 'nestedEvaluate');
  t.is(typeof bundle.source, 'string');
});

/** @param {string} string */
const encode = string => new TextEncoder().encode(string);

/** @param {Uint8Array} bytes */
const sha256 = bytes => {
  const hash = crypto.createHash('sha256');
  hash.update(bytes);
  return hash.digest().toString('hex');
};

test('bundle hash', async t => {
  // the bundle string on disk is ready to hash
  const supervisorBundleSpec = bundlePaths.supervisor;
  const bundleString = fs.readFileSync(supervisorBundleSpec, {
    encoding: 'utf-8',
  });
  const publishedHash = await getSupervisorBundleSHA256();
  t.is(sha256(encode(bundleString)), publishedHash);

  // The bundle object can be JSON-stringified and then hashed. This
  // serialization should be deterministic (JSON.stringify uses
  // property insertion order, but so did the JSON.parse done by
  // getSupervisorBundle)

  const bundle = await getSupervisorBundle();
  const bundleString2 = JSON.stringify(bundle);
  t.is(sha256(encode(bundleString2)), publishedHash);
});
