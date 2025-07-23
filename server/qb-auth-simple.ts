/**
 * Simple QuickBooks OAuth implementation for authorization
 */

export function generateQBAuthUrl(clientId: string, redirectUri: string): string {
  const scope = 'com.intuit.quickbooks.accounting';
  const state = Math.random().toString(36).substring(7);
  
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    state: state
  });

  return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
}

export async function exchangeQBCodeForToken(
  code: string, 
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}