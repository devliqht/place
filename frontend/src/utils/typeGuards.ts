import { ApiError } from '../types';

export function isApiError(response: unknown): response is ApiError {
  return response !== null && typeof response === 'object' && 'success' in response && response.success === false && 'error' in response;
}
