import { expect, test } from '@playwright/test'
import { LoginDTO } from './dto/LoginDTO'
import { OrderDTO } from './dto/OrderDTO'
import { StatusCodes } from 'http-status-codes'
import { APIRequestContext } from 'playwright-core'

const BASE_URL = 'https://backend.tallinn-learning.ee'
const LOGIN_PATH = '/login/student'
const ORDER_PATH = '/orders'

async function auth(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${BASE_URL}${LOGIN_PATH}`, {
    data: LoginDTO.createLoginWithCorrectData(),
  })
  expect(response.status()).toBe(StatusCodes.OK)
  return await response.text()
}

async function createOrder(request: APIRequestContext, jwt: string): Promise<number> {
  const response = await request.post(`${BASE_URL}${ORDER_PATH}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    data: OrderDTO.createOrderWithRandomData(),
  })
  expect(response.status()).toBe(StatusCodes.OK)
  const order = await response.json()
  return order.id
}


test('Authorization + Search order by ID ', async ({ request }) => {
  const jwt = await auth(request)
  const orderId = await createOrder(request, jwt)

  const findResponse = await request.get(`${BASE_URL}${ORDER_PATH}/${orderId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  expect(findResponse.status()).toBe(StatusCodes.OK)

  const foundOrder: OrderDTO = await findResponse.json()
  expect(foundOrder.id).toBe(orderId)

  console.log('Found order ID:', foundOrder.id)
})

test('Authorization + Delete order by ID', async ({ request }) => {
  const jwt = await auth(request)

  const orderId = await createOrder(request, jwt)
  console.log(`Created order ID: ${orderId}`)

  const deleteResponse = await request.delete(`${BASE_URL}${ORDER_PATH}/${orderId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  expect([200, 204]).toContain(deleteResponse.status())
  console.log(`Order deleted successfully (${deleteResponse.status()})`)

  const checkResponse = await request.get(`${BASE_URL}${ORDER_PATH}/${orderId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  console.log(`GET after delete: status ${checkResponse.status()}`)

  let bodyJson: any = {}
  const bodyText = await checkResponse.text()
  if (bodyText && bodyText.trim().length > 0) {
    bodyJson = JSON.parse(bodyText)
  }

  if (checkResponse.status() === 200) {
    expect(bodyJson.deleted === true || Object.keys(bodyJson).length === 0).toBeTruthy()
  } else {
    expect([400, 404]).toContain(checkResponse.status())
  }

  console.log(`Verified order ${orderId} deletion`)
})