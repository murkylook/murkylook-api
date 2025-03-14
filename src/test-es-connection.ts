import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  node: process.env.ELASTICSEARCH_HOST,
  auth: {
    username: process.env.ELASTICSEARCH_USER || '',
    password: process.env.ELASTICSEARCH_PASSWORD || ''
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const info = await client.info();
    console.log('Elasticsearch connection successful!');
    console.log('Cluster info:', info);

    // Test search for Barcelona
    const searchResult = await client.search({
      index: ['destinations', 'countries', 'continents', 'highlights'],
      query: {
        multi_match: {
          query: 'Barcelona',
          fields: ['name^2', 'description'],
          fuzziness: 'AUTO'
        }
      }
    });

    console.log('Search results:', JSON.stringify(searchResult.hits.hits, null, 2));
  } catch (error) {
    console.error('Failed to connect to Elasticsearch:', error);
  }
}

testConnection(); 