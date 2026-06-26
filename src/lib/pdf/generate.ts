import { pdf, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Renders a react-pdf document to a Blob, triggers a browser download, and
 * uploads the same blob to Supabase Storage in the background for archival.
 *
 * The user sees an instant download; the upload is fire-and-forget but
 * surfaces failures via the returned promise so the caller can toast.
 *
 * Path convention: `documents` bucket, key = e.g. `rent-dues/{id}/invoice.pdf`.
 * Re-running upserts (overwrites) the previous file at the same key.
 */
export async function downloadAndArchivePdf(args: {
  document: ReactElement<DocumentProps>
  /** User-facing filename for the download (e.g. "Facture 202606.pdf"). */
  filename: string
  /** Storage path inside the `documents` bucket. */
  storagePath: string
}): Promise<void> {
  const { document, filename, storagePath } = args

  // 1. Render the react-pdf tree to a Blob (PDF bytes).
  const blob = await pdf(document).toBlob()

  // 2. Trigger the browser download immediately so the UI feels instant.
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = filename
  window.document.body.appendChild(anchor)
  anchor.click()
  window.document.body.removeChild(anchor)
  // Defer revocation so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)

  // 3. Upload to Storage as the archival copy. Upsert so re-downloading a
  //    rent due overwrites the same key. If the bucket isn't set up yet the
  //    error bubbles up — caller decides whether to surface it.
  const { error } = await supabase.storage
    .from('documents')
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (error) {
    throw new Error(`Archivage échoué : ${error.message}`)
  }
}
