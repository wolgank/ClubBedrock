// tests/member_requests.spec.ts
import { test, expect, beforeAll } from 'bun:test'
import { memberTypeSelectSchema } from '../../../db/schema/MemberType'
import { memberRequestSelectSchema } from '../../../db/schema/MemberRequest'
import { memberInclusionRequestSelectSchema } from '../../../db/schema/MemberInclusionRequest'

let authToken: string
let createdMemberTypeId: number
let createdRequestId: number
//test sin funcar, pero lo probé manualmente con postman y sí
beforeAll(async () => {
  // 1) Login
  const loginResponse = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'password123',
    }),
  })
  expect(loginResponse.status).toBe(200)
  const loginBody = (await loginResponse.json()) as { token: string }
  authToken = `Bearer ${loginBody.token}`

  // 2) Create MemberType
  const mtResponse = await fetch('http://127.0.0.1:3000/api/member-types/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify({
      name: 'TITULAR',
      description: 'Miembro titular con todos los beneficios',
      inclusionCost: 100.0,
      exclusionCost: 50.0,
      canPayAndRegister: true,
      costInMembershipFee: 20.0,
    }),
  })
  expect(mtResponse.status).toBe(201)

  const rawMT = await mtResponse.json()
  const mtParsed = memberTypeSelectSchema.safeParse(rawMT)
  if (!mtParsed.success) {
    console.error(mtParsed.error.format())
    throw new Error('MemberType validation failed')
  }
  createdMemberTypeId = mtParsed.data.id
})

test('GET /member-types/:id devuelve el tipo TITULAR correctamente', async () => {
  const res = await fetch(`http://127.0.0.1:3000/member-types/${createdMemberTypeId}`, {
    headers: { 'Authorization': authToken },
  })
  expect(res.status).toBe(200)

  const raw = await res.json()
  const parsed = memberTypeSelectSchema.safeParse(raw)
  if (!parsed.success) {
    console.error(parsed.error.format())
    throw new Error('GET MemberType validation failed')
  }
  expect(parsed.data.name).toBe('TITULAR')
})

test('POST /member-requests crea correctamente la solicitud e inclusión', async () => {
  const payload = {
    reason: 'Solicitud de prueba',
    submissionDate: '2025-05-08',
    requestState: 'PENDING',
    newMemberDocumentType: 'DNI',
    newMemberDocumentId: '87654321',
    newMemberName: 'Ana',
    newMemberLastName: 'García',
    memberTypeName: 'TITULAR',
  }

  const res = await fetch('http://127.0.0.1:3000/api/member-requests/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken,
    },
    body: JSON.stringify(payload),
  })
  expect(res.status).toBe(201)

  const raw = await res.json()
  const { request: rawReq, inclusion: rawInc, memberType: rawMT } =
    raw as { request: unknown; inclusion: unknown; memberType: unknown }

  const reqParsed = memberRequestSelectSchema.safeParse(rawReq)
  if (!reqParsed.success) {
    console.error(reqParsed.error.format())
    throw new Error('Request validation failed')
  }
  const incParsed = memberInclusionRequestSelectSchema.safeParse(rawInc)
  if (!incParsed.success) {
    console.error(incParsed.error.format())
    throw new Error('Inclusion validation failed')
  }
  const mtParsed = memberTypeSelectSchema.safeParse(rawMT)
  if (!mtParsed.success) {
    console.error(mtParsed.error.format())
    throw new Error('MemberType embed validation failed')
  }

  expect(reqParsed.data.reason).toBe(payload.reason)
  expect(incParsed.data.id).toBe(reqParsed.data.id)
  expect(incParsed.data.newMemberType).toBe(createdMemberTypeId)

  createdRequestId = reqParsed.data.id
})

test('GET /member-requests devuelve la lista e incluye nuestra solicitud', async () => {
  const res = await fetch('http://127.0.0.1:3000/api/member-requests/', {
    headers: { 'Authorization': authToken },
  })
  expect(res.status).toBe(200)

  // Narrow rawList to any[]
  const rawList = (await res.json()) as any[]
  expect(Array.isArray(rawList)).toBe(true)

  const found = rawList.find((item) => item.request.id === createdRequestId)
  expect(found).toBeDefined()

  const reqParsed = memberRequestSelectSchema.safeParse(found.request)
  if (!reqParsed.success) throw new Error('List request invalid')
  const incParsed = memberInclusionRequestSelectSchema.safeParse(found.inclusion)
  if (!incParsed.success) throw new Error('List inclusion invalid')
  const mtParsed = memberTypeSelectSchema.safeParse(found.memberType)
  if (!mtParsed.success) throw new Error('List memberType invalid')
})

test('GET /member-requests/:id devuelve correctamente el request específico', async () => {
  const res = await fetch(`http://127.0.0.1:3000/api/member-requests/${createdRequestId}`, {
    headers: { 'Authorization': authToken },
  })
  expect(res.status).toBe(200)

  const raw = await res.json()
  const { request: rawReq, inclusion: rawInc, memberType: rawMT } =
    raw as { request: unknown; inclusion: unknown; memberType: unknown }

  const reqParsed = memberRequestSelectSchema.safeParse(rawReq)
  if (!reqParsed.success) throw new Error('GET/:id request invalid')
  const incParsed = memberInclusionRequestSelectSchema.safeParse(rawInc)
  if (!incParsed.success) throw new Error('GET/:id inclusion invalid')
  const mtParsed = memberTypeSelectSchema.safeParse(rawMT)
  if (!mtParsed.success) throw new Error('GET/:id memberType invalid')
})
