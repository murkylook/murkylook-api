import dotenv from 'dotenv';
import { pgPool } from './config/database';
import { SearchService } from './services/search.service';
import { DestinationService } from './services/destination.service';
import { CountryService } from './services/country.service';
import { ContinentService } from './services/continent.service';
import { HighlightService } from './services/highlight.service';

dotenv.config();

async function indexAllData() {
  try {
    console.log('Starting data indexing...');
    
    const searchService = new SearchService();
    const destinationService = new DestinationService(pgPool);
    const countryService = new CountryService(pgPool);
    const continentService = new ContinentService(pgPool);
    const highlightService = new HighlightService(pgPool);

    // Get all data
    const destinations = await destinationService.getAll();
    const countries = await countryService.getAll();
    const continents = await continentService.getAll();
    const highlights = await highlightService.getAll();

    console.log(`Found: ${destinations.length} destinations, ${countries.length} countries, ${continents.length} continents, ${highlights.length} highlights`);

    // Index all data
    await searchService.reindexAll(destinations, countries, continents, highlights);
    
    console.log('Data indexing completed successfully!');
  } catch (error) {
    console.error('Failed to index data:', error);
  } finally {
    await pgPool.end();
  }
}

indexAllData(); 