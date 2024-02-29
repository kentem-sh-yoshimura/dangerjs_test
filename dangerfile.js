import { danger, message, schedule, warn } from 'danger'

const diffJson = (obj1, obj2) => {
  const diff = {}

  for (const key in obj1)
    if (obj1.hasOwnProperty(key)) {
      const value1 = obj1[key]
      const value2 = obj2[key]

      if (value1 instanceof Object && value2 instanceof Object) {
        const nestedDiff = diffJson(value1, value2)
        if (Object.keys(nestedDiff).length > 0) diff[key] = nestedDiff
      } else if (value1 !== value2)
        diff[key] = value2 !== undefined ? value2 : '削除'
    }

  for (const key in obj2)
    if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key))
      diff[key] = obj2[key]

  return diff
} 

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
  if (!hasModifiedPackageJson) return
  const packageDiff = await danger.git.JSONDiffForFile('package.json')

  // if(packageDiff.dependencies?.added?.length)message(packageDiff.dependencies.added.join(',') )
  // if(packageDiff.dependencies?.removed?.length)message(packageDiff.dependencies.removed.join(','))
  // if(packageDiff.devDependencies?.added?.length)message(packageDiff.devDependencies.added.join(',') )
  // if(packageDiff.devDependencies?.removed?.length)message(packageDiff.devDependencies.removed.join(','))

  const beforeDependencies = packageDiff.dependencies?.before
  const afterDependencies = packageDiff.dependencies?.after
  const beforeDevDependencies = packageDiff.devDependencies?.before
  const afterDevDependencies = packageDiff.devDependencies?.after

  if(beforeDependencies)message(JSON.stringify(beforeDependencies))
  if(afterDependencies)message(JSON.stringify(afterDependencies))
  if(beforeDevDependencies)message(JSON.stringify(beforeDevDependencies))
  if(afterDevDependencies)message(JSON.stringify(afterDevDependencies))

  if (beforeDependencies && afterDependencies) {
    const removeDependencies = diffJson(
      beforeDependencies,
      afterDependencies,
    ).toString()
    const addDependencies = diffJson(
      afterDependencies,
      beforeDependencies,
    ).toString()
    if (removeDependencies) message(removeDependencies)
    if (addDependencies) message(addDependencies)
  }
  if (beforeDevDependencies && afterDevDependencies) {
    const removeDevDependencies = diffJson(
      beforeDevDependencies,
      afterDevDependencies,
    ).toString()
    const addDevDependencies = diffJson(
      afterDevDependencies,
      beforeDevDependencies,
    ).toString()
    if (removeDevDependencies) message(removeDevDependencies)
    if (addDevDependencies) message(addDevDependencies)
  }
})
