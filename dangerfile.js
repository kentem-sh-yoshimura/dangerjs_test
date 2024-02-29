import { danger, message, schedule, warn } from 'danger'

// obj2にない、obj1のエントリを抽出
const diffObject = (obj1, obj2) => {
  const obj1Entries = Object.entries(obj1)
  const obj2Entries = Object.entries(obj2)

  const result = []
  obj1Entries.forEach((obj1Entry) => {
    const obj1EntryString = `${obj1Entry[0]}: ${obj1Entry[1]}`
    if (
      obj2Entries.some((obj2Entry) => {
        const obj2EntryString = `${obj2Entry[0]}: ${obj2Entry[1]}`
        return obj1EntryString !== obj2EntryString
      })
    )
      result.push(obj1EntryString)
  })
  return result
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

  const beforeDependencies = packageDiff.dependencies?.before
  const afterDependencies = packageDiff.dependencies?.after
  const beforeDevDependencies = packageDiff.devDependencies?.before
  const afterDevDependencies = packageDiff.devDependencies?.after

  if (beforeDependencies && afterDependencies) {
    const removeDependencies = diffObject(beforeDependencies, afterDependencies)
    const addDependencies = diffObject(afterDependencies, beforeDependencies)
    if (removeDependencies.length)
      message(`Dependencies削除: ${removeDependencies.join(', ')}`)
    if (addDependencies.length)
      message(`Dependencies追加: ${addDependencies.join(', ')}`)
  }

  if (beforeDevDependencies && afterDevDependencies) {
    const removeDevDependencies = diffObject(
      beforeDevDependencies,
      afterDevDependencies,
    )
    const addDevDependencies = diffObject(
      afterDevDependencies,
      beforeDevDependencies,
    )
    if (removeDevDependencies.length)
      message(`DevDependencies削除: ${removeDevDependencies.join(', ')}`)
    if (addDevDependencies.length)
      message(`DevDependencies追加: ${addDevDependencies.join(', ')}`)
  }
})
