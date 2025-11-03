import { expect, test } from '@playwright/test'
import { ApiClient } from '../src/ApiClient'

test('login and create order with api client', async ({ request }) => {
  const apiClient = await ApiClient.create(request)
  const orderId = await apiClient.createOrderAndReturnOrderId()
  console.log('orderId:', orderId)
})

test('get orders with api client', async ({ request }) => {
  const apiClient = await ApiClient.create(request)
  const ordersBefore = await apiClient.getOrders()
  await apiClient.createOrderAndReturnOrderId()
  const ordersAfter = await apiClient.getOrders()

  expect(ordersBefore.length < ordersAfter.length).toBeTruthy()
})

test('Authorization + Search order by ID', async ({ request }) => {
  const apiClient = await ApiClient.create(request)
  const orderId = await apiClient.createOrderAndReturnOrderId()

  const foundOrder = await apiClient.getOrderById(orderId)
  expect(foundOrder.id).toBe(orderId)

  console.log('Order found by ID:', foundOrder.id)
})

test('Authorization + Delete order by ID', async ({ request }) => {
  const apiClient = await ApiClient.create(request)
  const orderId = await apiClient.createOrderAndReturnOrderId()

  const deleted = await apiClient.deleteOrderById(orderId)
  expect(deleted).toBe(true)

  const checkResponse = await request.get(`https://backend.tallinn-learning.ee/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${apiClient.jwt}` },
  })

  expect(checkResponse.status()).toBe(200)

  console.log('Order successfully deleted:', orderId)
})
