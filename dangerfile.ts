import { danger, message, schedule, warn } from 'danger'

const hasModifiedPackageJson =
  danger.git.modified_files.includes('package.json')
const hasModifiedPackageLockJson =
  danger.git.modified_files.includes('package-lock.json')

// package-lock.jsonに修正がある
if (hasModifiedPackageLockJson)
  message(
    'package-lock.jsonが更新されています。レビュアーはパッケージのインストールを行ってください。',
  )

// package.jsonに修正があるが、package-lock.jsonにない
if (hasModifiedPackageJson && !hasModifiedPackageLockJson)
  warn(
    'package.jsonが修正されていますが、package-lock.jsonが修正されていないようです。',
  )

schedule(async () => {
  const packageDiff = await danger.git.JSONDiffForFile('package.json')

  message(packageDiff.dependencies?.added ? packageDiff.dependencies.added.join(',') : '')
  message(packageDiff.dependencies?.removed ? packageDiff.dependencies.removed.join(',') : '')

})
