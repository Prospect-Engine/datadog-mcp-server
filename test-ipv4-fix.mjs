import axios from 'axios';
import http from 'http';
import https from 'https';

const apiUrl = 'https://api.datadoghq.com/api/v2/logs/events/search';
const headers = {
  'Content-Type': 'application/json',
  'DD-API-KEY': '944e0cedc267ca157830fd5f46c5a558',
  'DD-APPLICATION-KEY': '33eb23f51a2e2e53ceed890781b4768e97ee4a34'
};

const body = {
  filter: {
    query: 'status:error',
    from: 'now-1h',
    to: 'now'
  },
  page: { limit: 3 }
};

try {
  console.log('Testing with IPv4-only agents...');
  const response = await axios.post(apiUrl, body, {
    headers: headers,
    timeout: 30000,
    httpAgent: new http.Agent({ family: 4 }),
    httpsAgent: new https.Agent({ family: 4 })
  });
  console.log('SUCCESS! Got', response.data.data?.length, 'logs');
  console.log('First log service:', response.data.data?.[0]?.attributes?.service);
} catch (error) {
  console.error('ERROR:', error.message);
  console.error('Error code:', error.code);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', JSON.stringify(error.response.data).substring(0, 200));
  }
}
