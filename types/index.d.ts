// TODO add correct namespace
interface ErrorLogEntry {
  message: string;
}

interface Timing {
  _value: number;
  _field: string;
}

interface StepFunction {
  (logger: winston.Logger, tmpDir: string): Promise<boolean>;
}

interface VaultItem {
  details: Record<string, unknown>;
  overview: {
    title: string;
    URLs: [
      {
        u: string;
      }
    ];
  };
}

declare const StyleDictionaryObject: {
  [key: string]: string | StyleDictionaryObject;
};

interface AnalyticsUtil {
  helper: {
    init: (
      moduleString: string,
      commandString: string,
      instanceString: string
    ) => void;
    writeTiming: (subCommandName: string, ms: number) => void;
    getAverageTiming: () => Promise<Timing[]>;
    close: () => Promise<void>;
    timeStart: (name: string, category: string) => Promise<void>;
    timeEnd: (name: string, category: string) => Promise<void>;
  };
}

interface DockerUtil {
  helper: {
    run: (
      name: string,
      image: string,
      command: string[],
      binds: string[],
      envFile: boolean,
      autoRemove: boolean
    ) => Promise<void>;
  };
}

interface FileUtil {
  helper: {
    removeRepeatedEmptyLines: (filePath: string) => Promise<void>;
  };
}

interface GitUtil {
  backupSuffix: string;
  helper: {
    checkoutRepo: (projectKey: string, repoName: string) => Promise<string>;
    checkoutBranch: (branchName: string) => Promise<string>;
    checkoutNewBranch: (
      branchName: string,
      fromBranchName: string
    ) => Promise<void>;
    checkoutTag: (tagName: string) => Promise<string>;
    mergeBranch: (
      fromBranchName: string,
      toBranchName: string,
      push: boolean
    ) => Promise<MergeResult>;
    addRemote: (remoteName: string, remoteUri: string) => Promise<string>;
    removeRemote: (remoteName: string) => Promise<void>;
    addBitbucketRemote: (
      remoteName: string,
      projectKey: string,
      repoName: string
    ) => Promise<string>;
    addCommitPushPaths: (
      localPaths: string[],
      commitMsg: string,
      branchName: string
    ) => Promise<string>;
    addCommitPushPath: (
      localPath: string,
      commitMsg: string,
      branchName: string
    ) => Promise<void>;
    hasRemoteBranch: (
      branchName: string,
      remoteName: string
    ) => Promise<boolean>;
    fetchTags: () => Promise<FetchResult>;
    pushTags: () => Promise<PushResult>;
    pushBranch: (branchName: string) => Promise<PushResult>;
    pushNewBranch: (branchName: string) => Promise<PushResult>;
    mergeUnrelatedHistoriesBranch: (branchName: string) => Promise<MergeResult>;
    pull: () => Promise<PullResult>;
    reset: () => Promise<string>;
  };
}

interface JsonUtil {
  helper: {
    copyValue: (
      fromSelector: string,
      fromFile: string,
      toSelector: string,
      toFile: string
    ) => void;
    getValue: (selector: string, file: string) => string;
    setValue: (
      selector: string,
      value: Record<string, unknown>,
      file: string
    ) => void;
    addValueToArray: (
      selector: string,
      value: Record<string, unknown>,
      file: string
    ) => void;
    deleteKey: (selector: string, file: string) => void;
    writeToFile: (json: Record<string, unknown>, file: string) => Promise<void>;
    prettyPrintJson: (json: Record<string, unknown>) => string;
  };
}

interface NpmUtil {
  helper: {
    getVersion: (packageName: string) => string;
    install: () => Promise<string>;
    installDependency: (dependency: string, version: string) => Promise<string>;
    installDependencies: (dependencies: string[] = []) => Promise<string>;
    uninstallDependency: (dependency: string) => Promise<string>;
    unpublishPackage: (packageName: string) => string;
  };
}

interface OnepasswordUtil {
  helper: {
    getSession: () => void;
    createVault: (vaultName: string) => string;
    getItemsForVaultString: (vaultName: string) => string;
    getItemsForVault: (vaultName: string) => VaultItem;
    getItemString: (itemUuid: string) => string;
    getItem: (itemUiid: string) => VaultItem;
    encodeItemDetails: (item: VaultItem) => string;
    createLoginItem: (item: VaultItem, vaultUuid: string) => string;
    createServerItem: (item: VaultItem, vaultUuid: string) => string;
    deleteVault: (vaultName: string) => void;
  };
}

interface PromiseUtil {
  helper: {
    alwaysTrue: (data: Record<string, unknown>) => Record<string, unknown>;
    delay: (ms: number) => Promise<unknown>;
    retry: (
      callback: () => Promise<{ data: Record<string, unknown> }>,
      delay = 1000,
      maxTries = 10,
      successCheck = alwaysTrueCheck
    ) => Promise<unknown>;
    forEach: <T>(
      array: T[],
      callback: (item: T, index: number, fullArray: T[]) => void
    ) => Promise<void>;
  };
}

interface ShellUtil {
  helper: {
    setTmpDir: (directory: string) => void;
    requireCommand: (commandName: string) => void;
    requireCommands: (commandNames: string[]) => void;
    fileExistsInCwd: (fileName: string) => boolean;
    dirExistsInCwd: (dirName: string) => boolean;
    backupDirInCwd: (dirName: string, prefix: string, move: boolean) => void;
    restoreDirInCwd: (dirName: string, prefix: string, move: boolean) => void;
    hasBackedUpDirInCwd: (dirName: string, prefix: string) => boolean;
  };
}

interface TemplateUtil {
  helper: {
    replaceAll: (string: string, mapObj: Record<string, string>) => string;
    templateFile: (
      fileName: string,
      options: Record<string, unknown>
    ) => Promise<void>;
    templateFiles: (
      fileNames: string[],
      options: Record<string, unknown>
    ) => Promise<boolean>;
    replaceInFile: (
      fileName: string,
      search: string,
      replace: string
    ) => Promise<boolean>;
  };
}

interface TokensUtil {
  helper: {
    generateFromPrimitivesJson: (
      primitiveTokenJson: Record<string, unknown>,
      targetDir?: string
    ) => Promise<void>;
    generateFromPrimitivesPath: (
      primitiveTokenPath: string,
      targetDir?: string
    ) => Promise<void>;
    generateFromSpecifyJson: (
      specifyTokenJson: TokenInterface[],
      initializedTokenJson: typeof StyleDictionaryObject,
      targetDir?: string
    ) => Promise<void>;
    generateFromSpecifyPath: (
      specifyTokenPath: string,
      primitiveTokenPath: string,
      targetDir?: string
    ) => Promise<void>;
    compileTokens: (styleDictionary: StyleDictionary.Core) => void;
    getStyleDictionary: (
      callingPath: string,
      sourceDir: string
    ) => StyleDictionary.Core;
  };
}

interface TaskUtil {
  init: (
    initConfig: Record<string, unknown> | null,
    rcOnly: boolean,
    isRevert: boolean,
    shouldCleanup: boolean,
    debugActive: boolean
  ) => Promise<Record<string, unknown>>;
  start: (
    identifier: string,
    asyncChecks: StepFunction[],
    asyncSubCommands: StepFunction[],
    asyncReverts: StepFunction[]
  ) => Promise<void>;
  getTmpDir: () => string;
  getCliDir: () => string;
  util: {
    sh;
    getLogger: winston.Logger;
    analytics: AnalyticsUtil;
    docker: DockerUtil;
    file: FileUtil;
    git: GitUtil;
    json: JsonUtil;
    npm: NpmUtil;
    onepassword: OnepasswordUtil;
    promise: PromiseUtil;
    shell: ShellUtil;
    template: TemplateUtil;
    tokens: TokensUtil;
  };
}

declare module '@kickstartds/core/design-tokens/index.js';
