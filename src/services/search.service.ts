import { Client } from '@elastic/elasticsearch';
import { Destination } from '../types/destination';
import { Country } from '../types/country';
import { Continent } from '../types/continent';
import { Highlight } from '../types/highlight';

export type SearchResult = {
  type: 'destination' | 'country' | 'continent' | 'highlight';
  id: number;
  name: string;
  description?: string;
  score: number;
};

export class SearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_HOST,
      auth: {
        username: process.env.ELASTICSEARCH_USER || '',
        password: process.env.ELASTICSEARCH_PASSWORD || ''
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async indexDestination(destination: Destination) {
    await this.client.index({
      index: 'destinations',
      id: destination.id.toString(),
      document: {
        name: destination.name,
        description: destination.description,
        type: 'destination'
      }
    });
  }

  async indexCountry(country: Country) {
    await this.client.index({
      index: 'countries',
      id: country.id.toString(),
      document: {
        name: country.name,
        description: country.description,
        type: 'country'
      }
    });
  }

  async indexContinent(continent: Continent) {
    await this.client.index({
      index: 'continents',
      id: continent.id.toString(),
      document: {
        name: continent.name,
        description: continent.description,
        type: 'continent'
      }
    });
  }

  async indexHighlight(highlight: Highlight) {
    await this.client.index({
      index: 'highlights',
      id: highlight.id.toString(),
      document: {
        name: highlight.name,
        description: highlight.description,
        type: 'highlight'
      }
    });
  }

  async search(query: string): Promise<SearchResult[]> {
    if (query.length < 3) {
      return [];
    }

    const { hits } = await this.client.search({
      index: ['destinations', 'countries', 'continents', 'highlights'],
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query,
                fields: ['name^3', 'description'],
                type: 'phrase_prefix',
                boost: 2
              }
            },
            {
              multi_match: {
                query,
                fields: ['name^2', 'description'],
                fuzziness: 'AUTO',
                prefix_length: 2
              }
            },
            {
              multi_match: {
                query,
                fields: ['name^2', 'description'],
                type: 'best_fields',
                operator: 'and',
                boost: 1.5
              }
            }
          ]
        }
      }
    });

    return hits.hits.map(hit => ({
      type: (hit._source as any).type,
      id: parseInt(hit._id || '0'),
      name: (hit._source as any).name,
      description: (hit._source as any).description,
      score: hit._score || 0
    }));
  }

  async initializeIndices() {
    const indices = ['destinations', 'countries', 'continents', 'highlights'];
    
    for (const index of indices) {
      const exists = await this.client.indices.exists({ index });
      
      if (!exists) {
        await this.client.indices.create({
          index,
          mappings: {
            properties: {
              name: { 
                type: 'text',
                analyzer: 'standard',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  },
                  ngram: {
                    type: 'text',
                    analyzer: 'edge_ngram_analyzer'
                  }
                }
              },
              description: { 
                type: 'text',
                analyzer: 'standard'
              },
              type: { type: 'keyword' }
            }
          },
          settings: {
            analysis: {
              analyzer: {
                edge_ngram_analyzer: {
                  type: 'custom',
                  tokenizer: 'edge_ngram_tokenizer',
                  filter: ['lowercase']
                }
              },
              tokenizer: {
                edge_ngram_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          }
        });
      }
    }
  }

  async reindexAll(
    destinations: Destination[],
    countries: Country[],
    continents: Continent[],
    highlights: Highlight[]
  ) {
    await this.initializeIndices();

    const operations = [
      ...destinations.map(d => this.indexDestination(d)),
      ...countries.map(c => this.indexCountry(c)),
      ...continents.map(c => this.indexContinent(c)),
      ...highlights.map(h => this.indexHighlight(h))
    ];

    await Promise.all(operations);
  }
} 