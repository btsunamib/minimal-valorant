#!/usr/bin/env node
// Sync only a clean, committed release to an explicitly configured GitHub remote.
import { execFileSync } from 'node:child_process';
const [remote = 'github', branch = 'main'] = process.argv.slice(2);
const git = (...args) => execFileSync('git', args, {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
try {
  if (!/^[A-Za-z0-9_-]+$/.test(remote)) throw Error('Invalid remote name');
  git('check-ref-format', `refs/heads/${branch}`);
  const url = git('remote','get-url','--push',remote);
  if (!/^(https:\/\/github\.com\/|git@github\.com:)[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(url)) throw Error('Remote must be an explicit github.com repository without embedded credentials');
  if (git('status','--porcelain')) throw Error('Commit all intended changes before release sync');
  const sha = git('rev-parse','HEAD');
  execFileSync('git',['push',remote,`HEAD:refs/heads/${branch}`],{stdio:'inherit'});
  const actual = git('ls-remote',remote,`refs/heads/${branch}`).split(/\s+/)[0];
  if (actual !== sha) throw Error('Remote verification failed: branch does not match release commit');
  console.log(`Verified GitHub release: ${sha} (${remote}/${branch})`);
} catch (error) {
  console.error('GitHub release sync incomplete:', error.message);
  process.exitCode = 1;
}
