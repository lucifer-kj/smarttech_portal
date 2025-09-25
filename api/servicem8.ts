import { serviceM8Client } from '@/services/servicem8-client'

async function listClients() {
  const resp = await serviceM8Client.getClients()
  // Normalize to { data }
  const data = Array.isArray((resp as any)?.data)
    ? (resp as any).data
    : Array.isArray(resp)
      ? resp
      : []
  return { data }
}

async function createClients(payload: Record<string, unknown>) {
  const created = await serviceM8Client.createClient(payload)
  return { data: created }
}

async function listJobs(companyUuid: string, options: Record<string, unknown> = {}) {
  const resp = await serviceM8Client.getJobs(companyUuid, options)
  return { data: (resp as any)?.data, meta: (resp as any)?.meta }
}

export default {
  listClients,
  createClients,
  listJobs,
}


