import { APIRequestContext } from 'playwright-core'
import { LoginDTO } from '../tests/dto/LoginDTO'
import { StatusCodes } from 'http-status-codes'
import { OrderDTO } from '../tests/dto/OrderDTO'
import { expect } from '@playwright/test'

const serviceURL = 'https://backend.tallinn-learning.ee';
const loginPath = '/login/student';
const orderPath = '/orders';

export class ApiClient {
  request: APIRequestContext;
  readonly jwt: string;

  private constructor(request: APIRequestContext, jwt: string) {
    this.request = request;
    this.jwt = jwt;
  };

  static async create(request: APIRequestContext): Promise<ApiClient> {
    console.log('Requesting JWT...');
    const authResponse = await request.post(`${serviceURL}${loginPath}`, {
      data: LoginDTO.createLoginWithCorrectData()
    });

    if (authResponse.status() !== StatusCodes.OK) {
      console.log('Authorization failed');
      throw new Error(`Request failed with status ${authResponse.status()}`);
    }

    const jwt = await authResponse.text();

    return new ApiClient(request, jwt);
  }

  async createOrderAndReturnOrderId(): Promise<number> {
    console.log('Creating order...');
    const response = await this.request.post(`${serviceURL}${orderPath}`, {
      headers: {
        Authorization: `Bearer ${this.jwt}`
      },
      data: OrderDTO.createOrderWithRandomData()
    });
    console.log(`Order response:\n${await response.body()}`);
    expect(response.status()).toBe(StatusCodes.OK);
    const json: OrderDTO = await response.json();

    return json.id;
  }

  async getOrders(): Promise<OrderDTO[]> {
    console.log('Getting orders...');
    const response = await this.request.get(`${serviceURL}${orderPath}`, {
      headers: {
        Authorization: `Bearer ${this.jwt}`
      }
    });

    expect(response.status()).toBe(StatusCodes.OK);
    const json: OrderDTO[] = await response.json();
    expect(json.length).toBeGreaterThan(0);

    return json;

  }
  async getOrderById(orderId: number): Promise<OrderDTO> {
    const response = await this.request.get(`${serviceURL}${orderPath}/${orderId}`, {
      headers: { Authorization: `Bearer ${this.jwt}` },
    })
    expect(response.status()).toBe(StatusCodes.OK)
    const json: OrderDTO = await response.json()
    return json
  }


  async deleteOrderById(orderId: number): Promise<boolean> {
    const response = await this.request.delete(`${serviceURL}${orderPath}/${orderId}`, {
      headers: { Authorization: `Bearer ${this.jwt}` },
    })
    expect(response.status()).toBe(StatusCodes.OK)
    return true
  }
}


