import winston from 'winston';
import shell, { ShellString } from 'shelljs';
import chalkTemplate from 'chalk-template';
import { execFileSync } from 'child_process';

const onepasswordInstance = 'ruhmesmeile.1password.com';

export default (logger: winston.Logger): OnepasswordUtil => {
  const subCmdLogger = logger.child({ utility: true });
  const emailAddress = shell.cat('~/.ruhmesmeile/user').trim();

  let onepasswordToken: string;

  const getSession = (): void => {
    if (onepasswordToken && onepasswordToken.length > 0) {
      // do nothing, we already have a token
    } else if (
      shell.env.OP_SESSION_ruhmesmeile &&
      shell.env.OP_SESSION_ruhmesmeile.length > 0
    ) {
      onepasswordToken = shell.env.OP_SESSION_ruhmesmeile;

      subCmdLogger.info(
        chalkTemplate`already authenticated against 1Password for user {bold ${emailAddress}} on instance {bold ${onepasswordInstance}}`
      );
    } else {
      onepasswordToken = execFileSync(
        'op',
        ['signin', '--raw', onepasswordInstance, emailAddress],
        { stdio: [process.stdin, 'pipe', process.stderr] }
      ).toString();
      shell.env.OP_SESSION_ruhmesmeile = onepasswordToken;

      subCmdLogger.info(
        chalkTemplate`authenticated user {bold ${emailAddress}} against 1Password for instance {bold ${onepasswordInstance}}`
      );
    }
  };

  const createVault = (vaultName: string): string => {
    const opResult = shell.exec(
      `op create vault "${vaultName}" --session ${onepasswordToken}`
    );

    subCmdLogger.info(
      chalkTemplate`created vault {bold ${vaultName}} in 1Password`
    );
    return JSON.parse(opResult.stdout).uuid as string;
  };

  const getItemsForVaultString = (vaultName: string): string =>
    shell.exec(
      `op list items --vault="${vaultName}" --session ${onepasswordToken}`
    ).stdout;

  const getItemsForVault = (vaultName: string): VaultItem =>
    JSON.parse(getItemsForVaultString(vaultName));

  const getItemString = (itemUuid: string): string =>
    shell.exec(`op get item "${itemUuid}" --session ${onepasswordToken}`)
      .stdout;

  const getItem = (itemUuid: string): VaultItem =>
    JSON.parse(getItemString(itemUuid));

  const encodeItemDetails = (item: VaultItem): string =>
    new ShellString(JSON.stringify(item.details))
      .exec('op encode')
      .stdout.toString()
      .trim();

  const createLoginItem = (item: VaultItem, vaultUuid: string): string => {
    const opResult = shell.exec(
      `op create item login ${encodeItemDetails(
        item
      )} --vault="${vaultUuid}" --title="${item.overview.title}" --url="${
        item.overview.URLs[0].u
      }" --session ${onepasswordToken}`
    );
    subCmdLogger.info(
      chalkTemplate`created login item {bold ${item.overview.title}} for URL {bold ${item.overview.URLs[0].u}}`
    );

    return opResult.stdout;
  };

  const createServerItem = (item: VaultItem, vaultUuid: string): string => {
    const opResult = shell.exec(
      `op create item server ${encodeItemDetails(
        item
      )} --vault="${vaultUuid}" --title="${
        item.overview.title
      }" --session ${onepasswordToken}`
    );
    subCmdLogger.info(
      chalkTemplate`created server item {bold ${item.overview.title}}`
    );

    return opResult.stdout;
  };

  const deleteVault = (vaultName: string): void => {
    shell.exec(`op delete vault "${vaultName}" --session ${onepasswordToken}`);

    subCmdLogger.info(
      chalkTemplate`deleted vault {bold ${vaultName}} in 1Password`
    );
  };

  return {
    helper: {
      getSession,
      createVault,
      getItemsForVault,
      getItemsForVaultString,
      getItem,
      getItemString,
      encodeItemDetails,
      createLoginItem,
      createServerItem,
      deleteVault
    }
  };
};
