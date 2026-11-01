import { fetchApi } from '@/frontend/utils/api';
import { mockConnectedHealthResponse, mockDisconnectedHealthResponse } from '../mocks/healthMock';

/**
 * Service to ping the GET /api/health endpoint
 * Returns contract-compliant response with measured roundtrip latency.
 */
export async function getHealthStatus({ forceMock = false, mockState = 'connected' } = {}) {
  // If explicitly testing via mock mode in development:
  if (forceMock) {
    // Simulate slight network delay
    await new Promise((resolve) => setTimeout(resolve, 350));
    return mockState === 'connected' ? mockConnectedHealthResponse : mockDisconnectedHealthResponse;
  }

  const startTime = Date.now();
  const response = await fetchApi('/api/health');
  const latencyMs = Date.now() - startTime;

  if (response.success && response.data) {
    return {
      ...response,
      data: {
        ...response.data,
        latencyMs: response.data.latencyMs || latencyMs,
      },
    };
  }

  return {
    ...response,
    data: {
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      latencyMs,
      ...(response.data || {}),
    },
  };
}

