import axios from 'axios'
import type { UseCaseInput, ROIResult } from '../types'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '' })

export async function fetchSectors(): Promise<Record<string, string[]>> {
  const res = await api.get('/api/sectors')
  return res.data
}

export async function evaluateROI(input: UseCaseInput): Promise<ROIResult> {
  const res = await api.post('/api/evaluate', input)
  return res.data
}

export async function downloadReport(result: ROIResult): Promise<void> {
  const res = await api.post('/api/generate-report', result, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  const disposition = res.headers['content-disposition'] as string | undefined
  let filename = 'NPC_AI_ROI_Report.docx'
  if (disposition) {
    const match = disposition.match(/filename="(.+)"/)
    if (match) filename = match[1]
  }
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
