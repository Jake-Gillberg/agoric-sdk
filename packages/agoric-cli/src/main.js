/* eslint-disable @jessie.js/no-nested-await */
/* global process */
import { Command } from 'commander';
import path from 'path';
import url from 'url';
import { assert, details as X } from '@agoric/assert';
import {
  DEFAULT_KEEP_POLLING_SECONDS,
  DEFAULT_JITTER_SECONDS,
} from '@agoric/casting';
import cosmosMain from './cosmos.js';
import deployMain from './deploy.js';
import runMain from './run.js';
import publishMain from './main-publish.js';
import initMain from './init.js';
import installMain from './install.js';
import setDefaultsMain from './set-defaults.js';
import startMain from './start.js';
import followMain from './follow.js';
import walletMain from './open.js';
import { makeWalletCommand } from './commands/wallet.js';

const DEFAULT_DAPP_TEMPLATE = 'dapp-fungible-faucet';
const DEFAULT_DAPP_URL_BASE = 'https://github.com/Agoric/';
const DEFAULT_DAPP_BRANCH = undefined;

const STAMP = '_agstate';

const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const main = async (progname, rawArgs, powers) => {
  const { anylogger, fs } = powers;
  const log = anylogger('agoric');

  const program = new Command();

  async function isNotBasedir() {
    try {
      await fs.stat(STAMP);
      return false;
    } catch (e) {
      log.error(`current directory wasn't created by '${progname} init'`);
      program.help();
    }
    return true;
  }

  function subMain(fn, args, options) {
    return fn(progname, args, powers, options).then(
      // This seems to be the only way to propagate the exit code.
      code => process.exit(code || 0),
    );
  }

  const pj = await fs.readFile(path.join(dirname, '..', 'package.json'));
  const pkg = JSON.parse(pj);
  program.name(pkg.name).version(pkg.version);

  program
    .option('--sdk', 'use the Agoric SDK containing this program')
    .option('--no-sdk', 'do not use the Agoric SDK containing this program')
    .option('--docker-tag <tag>', 'image tag to use for Docker containers')
    .option(
      '-v, --verbose',
      'verbosity that can be increased',
      (_value, previous) => previous + 1,
      0,
    );

  // Add each of the commands.
  program
    .command('cosmos <command...>')
    .description('client for an Agoric Cosmos chain')
    .action(async (command, _options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(cosmosMain, ['cosmos', ...command], opts);
    });

  const ibcSetup = path.join(
    dirname,
    '..',
    'node_modules',
    '.bin',
    'ibc-setup',
  );
  program.command(
    'ibc-setup <command...>',
    'set up Inter Blockchain Communication',
    { executableFile: ibcSetup },
  );

  program
    .command('open')
    .description('launch the Agoric UI')
    .option(
      '--hostport <host:port>',
      'host and port to connect to VM',
      '127.0.0.1:8000',
    )
    .option('--no-browser', `just display the URL, don't open a browser`)
    .option(
      '--repl [yes | only | no]',
      'whether to show the Read-eval-print loop [yes]',
      value => {
        assert(
          ['yes', 'only', 'no'].includes(value),
          X`--repl must be one of 'yes', 'no', or 'only'`,
          TypeError,
        );
        return value;
      },
    )
    .action(async (_options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(walletMain, ['wallet'], opts);
    });

  program
    .command('init <project>')
    .description('create a new Dapp directory named <project>')
    .option(
      '--dapp-template <name>',
      'use the template specified by <name>',
      DEFAULT_DAPP_TEMPLATE,
    )
    .option(
      '--dapp-base <base-url>',
      'find the template relative to <base-url>',
      DEFAULT_DAPP_URL_BASE,
    )
    .option(
      '--dapp-branch <branch>',
      'use this branch instead of the repository HEAD',
      DEFAULT_DAPP_BRANCH,
    )
    .action(async (project, _options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(initMain, ['init', project], opts);
    });

  program
    .command('set-defaults <program> <config-dir>')
    .description('update the configuration files for <program> in <config-dir>')
    .option(
      '--enable-cors',
      'open RPC and API endpoints to all cross-origin requests',
      false,
    )
    .option(
      '--export-metrics',
      'open ports to export Prometheus metrics',
      false,
    )
    .option(
      '--import-from <dir>',
      'import the exported configuration from <dir>',
    )
    .option(
      '--persistent-peers <addrs>',
      'set the config.toml p2p.persistent_peers value',
      '',
    )
    .option('--seeds <addrs>', 'set the config.toml p2p.seeds value', '')
    .option(
      '--unconditional-peer-ids <ids>',
      'set the config.toml p2p.unconditional_peer_ids value',
      '',
    )
    .action(async (prog, configDir, _options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(setDefaultsMain, ['set-defaults', prog, configDir], opts);
    });

  const ibcRelayer = path.join(
    dirname,
    '..',
    'node_modules',
    '.bin',
    'ibc-relayer',
  );
  program.command(
    'ibc-relayer',
    'run an Inter Blockchain Communications relayer',
    {
      executableFile: ibcRelayer,
    },
  );

  program
    .command('install [force-sdk-version]')
    .description('install Dapp dependencies')
    .action(async (forceSdkVersion, _options, cmd) => {
      await isNotBasedir();
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(installMain, ['install', forceSdkVersion], opts);
    });

  program
    .command('follow <path-spec...>')
    .description('follow an Agoric Casting leader')
    .option(
      '--proof <strict | optimistic | none>',
      'set proof mode',
      value => {
        assert(
          ['strict', 'optimistic', 'none'].includes(value),
          X`--proof must be one of 'strict', 'optimistic', or 'none'`,
          TypeError,
        );
        return value;
      },
      'optimistic',
    )
    .option(
      '--sleep <seconds>',
      'sleep <seconds> between polling (may be fractional)',
      value => {
        const num = Number(value);
        assert.equal(`${num}`, value, X`--sleep must be a number`, TypeError);
        return num;
      },
      DEFAULT_KEEP_POLLING_SECONDS,
    )
    .option(
      '--jitter <max-seconds>',
      'jitter up to <max-seconds> (may be fractional)',
      value => {
        const num = Number(value);
        assert.equal(`${num}`, value, X`--jitter must be a number`, TypeError);
        return num;
      },
      DEFAULT_JITTER_SECONDS,
    )
    .option(
      '-o, --output <format>',
      'value output format',
      value => {
        assert(
          [
            'hex',
            'justin',
            'justinlines',
            'json',
            'jsonlines',
            'text',
          ].includes(value),
          X`--output must be one of 'hex', 'justin', 'justinlines', 'json', 'jsonlines', or 'text'`,
          TypeError,
        );
        return value;
      },
      'justin',
    )
    .option(
      '-l, --lossy',
      'show only the most recent value for each sample interval',
    )
    .option(
      '-b, --block-height',
      'show first block height when each value was stored',
    )
    .option(
      '-c, --current-block-height',
      'show current block height when each value is reported',
    )
    .option('-B, --bootstrap <config>', 'network bootstrap configuration')
    .action(async (pathSpecs, _options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(followMain, ['follow', ...pathSpecs], opts);
    });

  const addRunOptions = cmd =>
    cmd
      .option(
        '--allow-unsafe-plugins',
        `CAREFUL: installed Agoric VM plugins will also have all your user's privileges`,
        false,
      )
      .option(
        '--hostport <host:port>',
        'host and port to connect to VM',
        '127.0.0.1:8000',
      )
      .option(
        '--need <subsystems>',
        'comma-separated names of subsystems to wait for',
        'local,agoric,wallet',
      )
      .option(
        '--provide <subsystems>',
        'comma-separated names of subsystems this script initializes',
        '',
      );

  program
    .command('run <script> [script-args...]')
    .description(
      'run a script with all your user privileges and some Agoric endowments',
    )
    .action(async (script, scriptArgs, _options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts(), scriptArgs };
      return subMain(runMain, ['run', script], opts);
    });

  addRunOptions(
    program
      .command('deploy [script...]')
      .option(
        '--target <target>',
        'One of agoric, local, cosmos, or sim',
        'agoric',
      )
      .description(
        'run multiple scripts with all your user privileges against the local Agoric VM',
      ),
  ).action(async (scripts, _options, cmd) => {
    const opts = { ...program.opts(), ...cmd.opts() };
    return subMain(deployMain, ['deploy', ...scripts], opts);
  });

  program
    .command('publish [bundle...]')
    .option(
      '-c, --chain-id <chainID>',
      'The ID of the destination chain',
      'agoriclocal',
    )
    .option(
      '-n, --node <rpcAddress>',
      'A bare IPv4 address or fully qualified URL of an RPC node',
      'http://localhost:26657',
    )
    .option(
      '-h, --home <directory>',
      "[required] Path to the directory containing ag-solo-mnemonic, for the publisher's wallet mnemonic",
    )
    .description('publish a bundle to a Cosmos chain')
    .action(async (bundles, _options, cmd) => {
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(publishMain, ['publish', ...bundles], opts);
    });

  program.addCommand(await makeWalletCommand());

  program
    .command('start [profile] [args...]')
    .description(
      `\
start an Agoric VM

agoric start - runs the default profile (dev)
agoric start dev -- [initArgs] - simulated chain and solo VM
agoric start local-chain [portNum] -- [initArgs] - local chain
agoric start local-solo [portNum] [provisionPowers] - local solo VM
`,
    )
    .option('-d, --debug', 'run in JS debugger mode')
    .option('--reset', 'clear all VM state before starting')
    .option('--no-restart', 'do not actually start the VM')
    .option('--pull', 'for Docker-based VM, pull the image before running')
    .option('--rebuild', 'rebuild VM dependencies before running')
    .option(
      '--delay [seconds]',
      'delay for simulated chain to process messages',
    )
    .option(
      '--inspect [host[:port]]',
      'activate inspector on host:port (default: "127.0.0.1:9229")',
    )
    .option(
      '--inspect-brk [host[:port]]',
      'activate inspector on host:port and break at start of script (default: "127.0.0.1:9229")',
    )
    .option(
      '--wallet <package>',
      'install the wallet from NPM package <package>',
      '@agoric/wallet-frontend',
    )
    .action(async (profile, args, _options, cmd) => {
      await isNotBasedir();
      const opts = { ...program.opts(), ...cmd.opts() };
      return subMain(startMain, ['start', profile, ...args], opts);
    });

  // Throw an error instead of exiting directly.
  program.exitOverride();

  // Hack: cosmos arguments are always unparsed.
  const cosmosIndex = rawArgs.indexOf('cosmos');
  if (cosmosIndex >= 0) {
    rawArgs.splice(cosmosIndex + 1, 0, '--');
  }

  try {
    await program.parseAsync(rawArgs, { from: 'user' });
  } catch (e) {
    if (e && e.name === 'CommanderError') {
      return e.exitCode;
    }
    throw e;
  }
  return 0;
};

export default main;
