import winston from 'winston';
import shell from 'shelljs';
import simpleGit, {
  ResetMode,
  MergeResult,
  FetchResult,
  PushResult,
  PullResult
} from 'simple-git';
import chalkTemplate from 'chalk-template';
import { GitUtil } from '../../types/index.js';

const { pwd } = shell;

export default (logger: winston.Logger): GitUtil => {
  const subCmdLogger = logger.child({ utility: true });

  const gitHost = 'ssh://git@github.com';
  const backupSuffix = '-backup';

  const checkoutRepo = async (
    projectKey: string,
    repoName: string
  ): Promise<string> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(
      chalkTemplate`cloning repository {bold ${projectKey}/${repoName}} to {bold ${shell
        .pwd()
        .toString()}}`
    );

    const result = await git.clone(`${gitHost}/${projectKey}/${repoName}.git`);

    subCmdLogger.info(
      chalkTemplate`repository {bold ${projectKey}/${repoName}} cloned to {bold ${shell
        .pwd()
        .toString()}} successfully`
    );
    return result;
  };

  const checkoutBranch = async (branchName: string): Promise<string> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(chalkTemplate`checking out branch {bold ${branchName}}`);

    const result = await git.checkout(branchName);

    subCmdLogger.info(
      chalkTemplate`finished checking out branch {bold ${branchName}}`
    );
    return result;
  };

  const checkoutNewBranch = async (
    branchName: string,
    fromBranchName = 'master'
  ): Promise<void> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(
      chalkTemplate`checking out {bold new} branch {bold ${branchName}} from ${fromBranchName}`
    );

    const result = await git.checkoutBranch(branchName, fromBranchName);

    subCmdLogger.info(
      chalkTemplate`finished checking out {bold new} branch {bold ${branchName}} from ${fromBranchName}`
    );
    return result;
  };

  const checkoutTag = async (tagName: string): Promise<string> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(chalkTemplate`checking out tag {bold ${tagName}}`);

    const result = await git.checkout(tagName);

    subCmdLogger.info(
      chalkTemplate`finished checking out tag {bold ${tagName}}`
    );
    return result;
  };

  const mergeBranch = async (
    fromBranchName: string,
    toBranchName: string,
    push = false
  ): Promise<MergeResult> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(
      chalkTemplate`merging branch {bold ${fromBranchName}} to ${toBranchName}`
    );

    const result = await git
      .checkout(toBranchName)
      .then(() => git.merge(['--no-edit', fromBranchName]));

    if (push) await git.push(['origin', toBranchName]);

    subCmdLogger.info(
      chalkTemplate`finished merging branch {bold ${fromBranchName}} to ${toBranchName}`
    );
    return result;
  };

  const addRemote = async (
    remoteName: string,
    remoteUri: string
  ): Promise<string> => {
    const git = simpleGit.default(pwd().toString());

    const result = await git.addRemote(remoteName, remoteUri);

    return result;
  };

  const removeRemote = async (remoteName: string): Promise<void> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(chalkTemplate`removing remote {bold ${remoteName}}`);

    const result = await git.removeRemote(remoteName);

    subCmdLogger.info(
      chalkTemplate`finished removing remote {bold ${remoteName}}`
    );
    return result;
  };

  const addBitbucketRemote = async (
    remoteName: string,
    projectKey: string,
    repoName: string
  ): Promise<string> => {
    subCmdLogger.info(
      chalkTemplate`adding remote {bold ${remoteName}}, pointing to {bold ${projectKey}/${repoName}}`
    );

    const result = await addRemote(
      remoteName,
      `${gitHost}/${projectKey}/${repoName}.git`
    );

    subCmdLogger.info(
      chalkTemplate`finished adding remote {bold ${remoteName}}, pointing to {bold ${projectKey}/${repoName}}`
    );
    return result;
  };

  const addCommitPushPaths = async (
    localPaths: string[],
    commitMsg: string,
    branchName: string
  ): Promise<string> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(
      chalkTemplate`adding, commiting and pushing local paths on branch {bold ${branchName}}`
    );

    const result = await git.add(localPaths);

    const diff = await git.diff(['HEAD']);
    if (diff.length > 0) {
      await git.commit(commitMsg).then(() => git.push('origin', branchName));
      subCmdLogger.info(
        chalkTemplate`finished adding, commiting and pushing local paths on branch {bold ${branchName}}`
      );
    } else {
      subCmdLogger.info(
        chalkTemplate`nothing to add, {bold not} commiting and pushing local paths on branch {bold ${branchName}}`
      );
    }

    return result;
  };

  const addCommitPushPath = async (
    localPath: string,
    commitMsg: string,
    branchName: string
  ): Promise<void> => {
    await addCommitPushPaths([localPath], commitMsg, branchName);
  };

  const hasRemoteBranch = async (
    branchName: string,
    remoteName = 'origin'
  ): Promise<boolean> => {
    const git = simpleGit.default(pwd().toString());

    const lsRemote = await git.listRemote(['--heads', remoteName, branchName]);
    return lsRemote.length > 0;
  };

  const fetchTags = async (): Promise<FetchResult> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info('fetching tags for repository');

    const result = await git.fetch(['before', '--tags']);

    subCmdLogger.info('finished fetching tags for repository');
    return result;
  };

  const pushTags = async (): Promise<PushResult> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info('pushing tags for repository');

    const result = await git.push(['--tags']);

    subCmdLogger.info('finished pushing tags for repository');
    return result;
  };

  const pushBranch = async (branchName: string): Promise<PushResult> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(chalkTemplate`pushing branch {bold ${branchName}}`);

    const result = await git.push(['--set-upstream', 'origin', branchName]);

    subCmdLogger.info(
      chalkTemplate`finished pushing branch {bold ${branchName}}`
    );
    return result;
  };

  const pushNewBranch = async (branchName: string): Promise<PushResult> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(
      chalkTemplate`pushing newly created branch {bold ${branchName}}`
    );

    const result = await git.push(['origin', branchName]);

    subCmdLogger.info(
      chalkTemplate`finished pushing newly created branch {bold ${branchName}}`
    );
    return result;
  };

  const mergeUnrelatedHistoriesBranch = async (
    branchName: string
  ): Promise<MergeResult> => {
    const git = simpleGit.default(pwd().toString());
    subCmdLogger.info(
      chalkTemplate`merging branch {bold ${branchName}} into current branch, allowing unrelated histories`
    );

    const result = await git.merge([
      '--no-edit',
      '--strategy-option',
      'theirs',
      '--allow-unrelated-histories',
      branchName
    ]);

    subCmdLogger.info(
      chalkTemplate`finished merging branch {bold ${branchName}} into current branch, allowing unrelated histories`
    );
    return result;
  };

  const pull = async (): Promise<PullResult> => {
    const git = simpleGit.default(shell.pwd().toString());
    subCmdLogger.info(chalkTemplate`pulling current branch`);

    const result = await git.pull();

    subCmdLogger.info(chalkTemplate`finished pulling current branch`);
    return result;
  };

  const reset = async (): Promise<string> => {
    const git = simpleGit.default(shell.pwd().toString());
    subCmdLogger.info(chalkTemplate`resetting current branch to remote state`);

    const result = await git.reset(ResetMode.HARD);

    subCmdLogger.info(
      chalkTemplate`finished resetting current branch to remote state`
    );
    return result;
  };

  return {
    backupSuffix,
    helper: {
      checkoutRepo,
      checkoutBranch,
      checkoutNewBranch,
      checkoutTag,
      mergeBranch,
      addRemote,
      removeRemote,
      addBitbucketRemote,
      addCommitPushPaths,
      addCommitPushPath,
      hasRemoteBranch,
      fetchTags,
      pushTags,
      pushBranch,
      pushNewBranch,
      mergeUnrelatedHistoriesBranch,
      pull,
      reset
    }
  };
};
