import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
