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
  if(!hasModifiedPackageJson) return
  const packageDiff = await danger.git.JSONDiffForFile('package.json')

  if(packageDiff.dependencies?.added)message(packageDiff.dependencies.added.join(',') )
  if(packageDiff.dependencies?.removed)message(packageDiff.dependencies.removed.join(','))

})
