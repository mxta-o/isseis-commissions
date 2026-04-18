const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed')
  }

  return payload
}

export async function checkCommissionStatus(trackingId) {
  const response = await fetch(`${API_URL}/api/commissions/${encodeURIComponent(trackingId)}`)
  return parseResponse(response)
}

export async function createCommission(formData) {
  const response = await fetch(`${API_URL}/api/commissions`, {
    method: 'POST',
    body: formData,
  })

  return parseResponse(response)
}
