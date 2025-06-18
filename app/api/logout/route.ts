import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ status: 'logged_out' });

  response.cookies.delete('token');

  return response;
}