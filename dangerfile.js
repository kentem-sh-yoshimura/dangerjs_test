import { danger, message, schedule, warn } from 'danger'

const diffDependencies = (before, after) => {
  const beforeEntries = Object.entries(before)
  const afterEntries = Object.entries(after)

  const addDependencies = []
  afterEntries.forEach((afterEntry) => {
    // beforeに同じkeyが無ければ追加判定
    if (!beforeEntries.some((beforeEntry) => beforeEntry[0] === afterEntry[0]))
      addDependencies.push(`${afterEntry[0]}: ${afterEntry[1]}`)
  })

  const updateDependencies = []
  const removeDependencies = []
  beforeEntries.forEach((beforeEntry) => {
    // afterに同じkeyがあるが、valueが違えば更新判定
    const find = afterEntries.find(
      (afterEntry) => beforeEntry[0] === afterEntry[0],
    )
    if (find && beforeEntry[1] !== find[1]) {
      updateDependencies.push(
        `${beforeEntry[0]}: ${beforeEntry[1]} ⇒ ${find[1]}`,
      )
      return
    }

    // afterに同じkeyが無ければ削除判定
    if (!afterEntries.some((afterEntry) => beforeEntry[0] === afterEntry[0]))
      removeDependencies.push(`${beforeEntry[0]}: ${beforeEntry[1]}`)
  })

  return { addDependencies, updateDependencies, removeDependencies }
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
  // package.jsonに修正があれば、依存関係の更新チェック
  if (!hasModifiedPackageJson) return
  const packageDiff = await danger.git.JSONDiffForFile('package.json')

  const beforeDependencies = packageDiff.dependencies?.before
  const afterDependencies = packageDiff.dependencies?.after
  const beforeDevDependencies = packageDiff.devDependencies?.before
  const afterDevDependencies = packageDiff.devDependencies?.after

  if (beforeDependencies && afterDependencies) {
    const { addDependencies, updateDependencies, removeDependencies } =
      diffDependencies(beforeDependencies, afterDependencies)
    if (addDependencies.length)
      message(`Dependencies追加: ${addDependencies.join(',<br>')}`)
    if (updateDependencies.length)
      message(`Dependencies更新: ${updateDependencies.join(',<br>')}`)
    if (removeDependencies.length)
      message(`Dependencies削除: ${removeDependencies.join(',<br>')}`)
  }

  if (beforeDevDependencies && afterDevDependencies) {
    const {
      addDependencies: addDevDependencies,
      updateDependencies: updateDevDependencies,
      removeDependencies: removeDevDependencies,
    } = diffDependencies(beforeDevDependencies, afterDevDependencies)
    if (addDevDependencies.length)
      message(`DevDependencies追加: ${addDevDependencies.join(',<br>')}`)
    if (updateDevDependencies.length)
      message(`DevDependencies更新: ${updateDevDependencies.join(',<br>')}`)
    if (removeDevDependencies.length)
      message(`DevDependencies削除: ${removeDevDependencies.join(',<br>')}`)
  }
})
