// supabase storage helpers. The bucket is private so the only way to read a file is a short-lived
// signed URL minted here
const { supabase } = require('../lib/supabase')
const { env } = require('../config/env')

const bucket = () => supabase.storage.from(env.storageBucket)

// uploads files in parallel to commissionId/fileType/n.ext and returns their paths.
// if any upload fails, the ones that succeeded are removed before throwing.
async function uploadFiles(commissionId, fileType, files, { startAt = 1 } = {}) {
  const results = await Promise.allSettled(
    files.map(async (file, i) => {
      const path = `${commissionId}/${fileType}/${startAt + i}.${file.ext}`
      const { error } = await bucket().upload(path, file.buffer, { contentType: file.mime, upsert: false })
      if (error) throw error
      return path
    }),
  )
  const uploaded = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  const failure = results.find(r => r.status === 'rejected')
  if (failure) {
    await removeFiles(uploaded)
    throw failure.reason
  }
  return uploaded
}

// best effort cleanup: logs instead of throwing so it never masks the error that triggered it
async function removeFiles(paths) {
  if (!paths.length) return
  const { error } = await bucket().remove(paths)
  if (error) console.error('Storage cleanup failed for', paths, error)
}

// returns [{ path, url }] valid for expiresInSeconds
async function signedUrls(paths, expiresInSeconds, { download = false } = {}) {
  if (!paths.length) return []
  const { data, error } = await bucket().createSignedUrls(paths, expiresInSeconds, { download })
  if (error) throw error
  // each entry can fail on its own (e.g. the object was deleted). skip those rather than return null links.
  return data.filter(d => !d.error && d.signedUrl).map(d => ({ path: d.path, url: d.signedUrl }))
}

module.exports = {
  uploadFiles,
  removeFiles,
  signedUrls,
}
