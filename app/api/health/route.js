import { connectDB, getConnectionStatus } from '../../../lib/mongodb.js';
import { successResponse, errorResponse } from '../../../backend/utils/apiResponse.js';

// Force dynamic execution for health check
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * Verifies system and MongoDB database connectivity.
 * Used by frontend health status indicator component and monitoring.
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Attempt database connection
    await connectDB();
    const status = getConnectionStatus();

    if (status.isConnected) {
      return successResponse(
        {
          status: 'healthy',
          database: 'connected',
          timestamp,
        },
        'System and database are healthy',
        200
      );
    }

    return errorResponse(
      'Database is not currently connected',
      [`Mongoose state is: ${status.state}`],
      503,
      {
        data: {
          status: 'degraded',
          database: status.state,
          timestamp,
        },
      }
    );
  } catch (error) {
    const status = getConnectionStatus();
    return errorResponse(
      'Database connection failed or not configured',
      [error.message || 'Unknown database error'],
      503,
      {
        data: {
          status: 'degraded',
          database: status.state || 'disconnected',
          timestamp,
        },
      }
    );
  }
}
