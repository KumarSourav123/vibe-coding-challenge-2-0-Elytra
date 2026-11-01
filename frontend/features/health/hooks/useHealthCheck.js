'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHealthStatus } from '../services/healthApi';

export function useHealthCheck({ autoPoll = true, pollIntervalMs = 20000 } = {}) {
  const [state, setState] = useState('loading'); // 'loading' | 'connected' | 'disconnected'
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [mockMode, setMockMode] = useState('real'); // 'real' | 'mock-connected' | 'mock-disconnected'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async (currentMockMode = mockMode) => {
    setIsRefreshing(true);
    try {
      const isMock = currentMockMode !== 'real';
      const mockState = currentMockMode === 'mock-connected' ? 'connected' : 'disconnected';

      const response = await getHealthStatus({
        forceMock: isMock,
        mockState,
      });

      setLastChecked(new Date());

      const isConnected = response.success && response.data?.database === 'connected';

      if (isConnected) {
        setState('connected');
        setData(response.data);
        setErrorMessage(null);
      } else {
        setState('disconnected');
        setData(response.data || null);
        setErrorMessage(
          response.message ||
          (response.errors && response.errors[0]) ||
          'Database is disconnected or backend /api/health endpoint is unreachable.'
        );
      }
    } catch (err) {
      setState('disconnected');
      setErrorMessage(err.message || 'Unexpected failure while checking health.');
      setData(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [mockMode]);

  useEffect(() => {
    checkHealth(mockMode);

    if (!autoPoll || mockMode !== 'real') return;

    const intervalId = setInterval(() => {
      checkHealth('real');
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [checkHealth, autoPoll, pollIntervalMs, mockMode]);

  const setSimulationMode = (mode) => {
    setMockMode(mode);
    checkHealth(mode);
  };

  return {
    state,
    data,
    errorMessage,
    lastChecked,
    isRefreshing,
    mockMode,
    setSimulationMode,
    refresh: () => checkHealth(mockMode),
  };
}

