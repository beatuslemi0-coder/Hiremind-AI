import client from './client'

export async function uploadDocument(documentType: string, file: File) {
  const formData = new FormData()
  formData.append('document_type', documentType)
  formData.append('file', file)

  const { data } = await client.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}

export async function getDocumentText(documentId: number) {
  const { data } = await client.get(`/documents/${documentId}/text`)
  return data
}

export async function analyzeDocument(documentId: number) {
  const { data } = await client.get(`/documents/${documentId}/analyze`)
  return data
}

export async function generateInterviewQuestion(documentId: number) {
  const { data } = await client.get(`/documents/${documentId}/interview-question`)
  return data
}
