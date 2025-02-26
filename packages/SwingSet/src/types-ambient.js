/**
 * @typedef { import('./types-external.js').BundleFormat } BundleFormat
 */

/**
 * @typedef { import('@endo/marshal').CapData<string> } SwingSetCapData
 */

/** @typedef { import('./types-external.js').BundleID } BundleID */
/** @typedef { import('./types-external.js').BundleCap } BundleCap */
/** @typedef { import('./types-external.js').EndoZipBase64Bundle } EndoZipBase64Bundle */

/**
 * @typedef { import('./types-external.js').GetExportBundle } GetExportBundle
 * @typedef { import('./types-external.js').NestedEvaluateBundle } NestedEvaluateBundle
 * @typedef { import('./types-external.js').Bundle } Bundle
 *
 * @typedef { import('./types-external.js').ManagerType } ManagerType
 * @typedef { import('./types-external.js').KernelOptions } KernelOptions
 */

/**
 * See ../docs/static-vats.md#vatpowers
 *
 * @typedef { import('./types-external.js').VatPowers } VatPowers
 * @typedef { import('./types-external.js').StaticVatPowers } StaticVatPowers
 * @typedef { import('./types-external.js').MeteringVatPowers } MeteringVatPowers
 *
 * @typedef { import('./types-external.js').TerminationVatPowers } TerminationVatPowers
 */

/**
 * @typedef { import('./types-external.js').Message } Message
 *
 * @typedef { import('./types-external.js').ResolutionPolicy } ResolutionPolicy
 *
 * @typedef { import('./types-external.js').KernelDeliveryMessage } KernelDeliveryMessage
 * @typedef { import('./types-external.js').KernelDeliveryOneNotify } KernelDeliveryOneNotify
 * @typedef { import('./types-external.js').KernelDeliveryNotify } KernelDeliveryNotify
 * @typedef { import('./types-external.js').KernelDeliveryDropExports } KernelDeliveryDropExports
 * @typedef { import('./types-external.js').KernelDeliveryRetireExports } KernelDeliveryRetireExports
 * @typedef { import('./types-external.js').KernelDeliveryRetireImports } KernelDeliveryRetireImports
 * @typedef { import('./types-external.js').KernelDeliveryStartVat } KernelDeliveryStartVat
 * @typedef { import('./types-external.js').KernelDeliveryChangeVatOptions } KernelDeliveryChangeVatOptions
 * @typedef { import('./types-external.js').KernelDeliveryBringOutYourDead } KernelDeliveryBringOutYourDead
 * @typedef { import('./types-external.js').KernelDeliveryObject } KernelDeliveryObject
 * @typedef { import('./types-external.js').KernelSyscallSend } KernelSyscallSend
 * @typedef { import('./types-external.js').KernelSyscallInvoke } KernelSyscallInvoke
 * @typedef { import('./types-external.js').KernelSyscallSubscribe } KernelSyscallSubscribe
 * @typedef { import('./types-external.js').KernelOneResolution } KernelOneResolution
 * @typedef { import('./types-external.js').KernelSyscallResolve } KernelSyscallResolve
 * @typedef { import('./types-external.js').KernelSyscallExit } KernelSyscallExit
 * @typedef { import('./types-external.js').KernelSyscallVatstoreGet } KernelSyscallVatstoreGet
 * @typedef { import('./types-external.js').KernelSyscallVatstoreGetNextKey } KernelSyscallVatstoreGetNextKey
 * @typedef { import('./types-external.js').KernelSyscallVatstoreSet } KernelSyscallVatstoreSet
 * @typedef { import('./types-external.js').KernelSyscallVatstoreDelete } KernelSyscallVatstoreDelete
 * @typedef { import('./types-external.js').KernelSyscallDropImports } KernelSyscallDropImports
 * @typedef { import('./types-external.js').KernelSyscallRetireImports } KernelSyscallRetireImports
 * @typedef { import('./types-external.js').KernelSyscallRetireExports } KernelSyscallRetireExports
 *
 * @typedef { import('./types-external.js').KernelSyscallObject } KernelSyscallObject
 * @typedef { import('./types-external.js').KernelSyscallResultOk } KernelSyscallResultOk
 * @typedef { import('./types-external.js').KernelSyscallResultError } KernelSyscallResultError
 * @typedef { import('./types-external.js').KernelSyscallResult } KernelSyscallResult
 *
 * @typedef { import('./types-external.js').DeviceInvocation } DeviceInvocation
 * @typedef { import('./types-external.js').DeviceInvocationResultOk } DeviceInvocationResultOk
 * @typedef { import('./types-external.js').DeviceInvocationResultError } DeviceInvocationResultError
 * @typedef { import('./types-external.js').DeviceInvocationResult } DeviceInvocationResult
 *
 * @typedef { import('./types-external.js').VatStats } VatStats
 * @typedef { import('./types-external.js').VatKeeper } VatKeeper
 * @typedef { import('./types-external.js').KernelKeeper } KernelKeeper
 * @typedef { import('./types-external.js').XSnap } XSnap
 * @typedef { import('./types-external.js').SlogFinishDelivery } SlogFinishDelivery
 * @typedef { import('./types-external.js').SlogFinishSyscall } SlogFinishSyscall
 * @typedef { import('./types-external.js').KernelSlog } KernelSlog
 * @typedef { import('./types-external.js').VatSlog } VatSlog
 *
 * @typedef { import('./types-external.js').SnapStore } SnapStore
 * @typedef { import('./types-external.js').SnapshotResult } SnapshotResult
 * @typedef { import('./types-external.js').WaitUntilQuiescent } WaitUntilQuiescent
 */

/**
 * @typedef { import('./types-external.js').SourceSpec } SourceSpec
 * @typedef { import('./types-external.js').BundleSpec } BundleSpec
 * @typedef { import('./types-external.js').BundleRef } BundleRef
 * @typedef { import('./types-external.js').SwingSetConfigProperties } SwingSetConfigProperties
 */

/**
 * @typedef { import('./types-external.js').SwingSetConfigDescriptor } SwingSetConfigDescriptor
 */

/**
 * @typedef { import('./types-external.js').SwingSetConfig } SwingSetConfig
 */

/**
 * @typedef { import('./types-external.js').SwingSetKernelConfig } SwingSetKernelConfig
 */

/**
 * @typedef { import('./types-external.js').SourceOfBundle } SourceOfBundle
 */
/**
 * @typedef { import('@agoric/swing-store').KVStore } KVStore
 * @typedef { import('@agoric/swing-store').TranscriptStore } TranscriptStore
 * @typedef { import('@agoric/swing-store').SwingStore } SwingStore
 * @typedef { import('@agoric/swing-store').SwingStoreKernelStorage } SwingStoreKernelStorage
 * @typedef { import('@agoric/swing-store').SwingStoreHostStorage } SwingStoreHostStorage
 */

/**
 * @typedef { import('./types-external.js').PolicyInputNone } PolicyInputNone
 * @typedef { import('./types-external.js').PolicyInputCreateVat } PolicyInputCreateVat
 * @typedef { import('./types-external.js').PolicyInputCrankComplete } PolicyInputCrankComplete
 * @typedef { import('./types-external.js').PolicyInputCrankFailed } PolicyInputCrankFailed
 * @typedef { import('./types-external.js').PolicyInput } PolicyInput
 * @typedef { import('./types-external.js').PolicyOutput } PolicyOutput
 * @typedef { import('./types-external.js').RunPolicy } RunPolicy
 */
