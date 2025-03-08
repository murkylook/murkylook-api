import { Pool } from 'pg';

interface BreadcrumbItem {
  text: string;
  tooltip: string;
  url: string;
  isActive: boolean;
}

interface BreadcrumbTrail {
  items: BreadcrumbItem[];
  currentPage: string;
}

interface EntityInfo {
  name: string;
  abbreviation: string;
  country_name: string;
  country_abbr: string;
  continent_name: string;
  continent_abbr: string;
  destination_name: string;
  destination_id: string;
}

type QueryParam = string | number | boolean | null;

// Define page types as a const for better type safety
const PAGE_TYPES = {
  HOME: 'home',
  EXPLORE: 'explore',
  CONTINENT: 'continent',
  COUNTRY: 'country',
  DESTINATION: 'destination'
} as const;

type PageType = typeof PAGE_TYPES[keyof typeof PAGE_TYPES];

// URL patterns for consistency
const URL_PATTERNS = {
  HOME: '/',
  EXPLORE: '/explore',
  CONTINENT: (abbr: string) => `/explore/${abbr.toLowerCase()}`,
  COUNTRY: (continentAbbr: string, countryAbbr: string) => 
    `/explore/${continentAbbr.toLowerCase()}/${countryAbbr.toLowerCase()}`,
  DESTINATION: (id: string) => `/destinations/${id}`
} as const;

export class BreadcrumbService {
  constructor(private readonly pgPool: Pool) {}

  private createBreadcrumb(
    text: string,
    tooltip: string,
    url: string,
    isActive: boolean
  ): BreadcrumbItem {
    return { text, tooltip, url, isActive };
  }

  private async getEntityInfo(query: string, params: QueryParam[]): Promise<EntityInfo> {
    const result = await this.pgPool.query<EntityInfo>(query, params);
    if (!result.rows[0]) {
      throw new Error('Entity not found');
    }
    return result.rows[0];
  }

  private getHomeItem(): BreadcrumbItem {
    return this.createBreadcrumb(
      'Home',
      'Return to homepage',
      URL_PATTERNS.HOME,
      false
    );
  }

  private getExploreItem(isActive: boolean): BreadcrumbItem {
    return this.createBreadcrumb(
      'Explore',
      'Explore destinations by continent',
      URL_PATTERNS.EXPLORE,
      isActive
    );
  }

  async generateBreadcrumbs(
    pageType: PageType,
    params?: { 
      continentAbbr?: string;
      countryAbbr?: string;
      destinationId?: string;
    }
  ): Promise<BreadcrumbTrail> {
    const trail: BreadcrumbItem[] = [this.getHomeItem()];

    try {
      switch (pageType) {
        case PAGE_TYPES.HOME:
          return {
            items: trail,
            currentPage: 'Home'
          };

        case PAGE_TYPES.EXPLORE:
          trail.push(this.getExploreItem(true));
          return {
            items: trail,
            currentPage: 'Explore'
          };

        case PAGE_TYPES.CONTINENT: {
          if (!params?.continentAbbr) {
            throw new Error('Continent abbreviation required');
          }

          const continentInfo = await this.getEntityInfo(
            'SELECT name, abbreviation FROM continents WHERE LOWER(abbreviation) = LOWER($1)',
            [params.continentAbbr]
          );

          trail.push(this.getExploreItem(false));
          trail.push(this.createBreadcrumb(
            continentInfo.name,
            `Explore ${continentInfo.name}`,
            URL_PATTERNS.CONTINENT(continentInfo.abbreviation),
            true
          ));

          return {
            items: trail,
            currentPage: continentInfo.name
          };
        }

        case PAGE_TYPES.COUNTRY: {
          if (!params?.continentAbbr || !params?.countryAbbr) {
            throw new Error('Continent and country abbreviations required');
          }

          const countryInfo = await this.getEntityInfo(
            `
            SELECT 
              c.name as country_name,
              c.abbreviation as country_abbr,
              cont.name as continent_name,
              cont.abbreviation as continent_abbr
            FROM countries c
            JOIN continents cont ON cont.id = c.continent_id
            WHERE LOWER(c.abbreviation) = LOWER($1)
            AND LOWER(cont.abbreviation) = LOWER($2)
            `,
            [params.countryAbbr, params.continentAbbr]
          );

          trail.push(this.getExploreItem(false));
          trail.push(this.createBreadcrumb(
            countryInfo.continent_name,
            `Explore ${countryInfo.continent_name}`,
            URL_PATTERNS.CONTINENT(countryInfo.continent_abbr),
            false
          ));
          trail.push(this.createBreadcrumb(
            countryInfo.country_name,
            `Explore destinations in ${countryInfo.country_name}`,
            URL_PATTERNS.COUNTRY(countryInfo.continent_abbr, countryInfo.country_abbr),
            true
          ));

          return {
            items: trail,
            currentPage: countryInfo.country_name
          };
        }

        case PAGE_TYPES.DESTINATION: {
          if (!params?.destinationId) {
            throw new Error('Destination ID required');
          }

          const destinationInfo = await this.getEntityInfo(
            `
            SELECT 
              d.name as destination_name,
              d.id as destination_id,
              c.name as country_name,
              c.abbreviation as country_abbr,
              cont.name as continent_name,
              cont.abbreviation as continent_abbr
            FROM destinations d
            JOIN countries c ON c.id = d.country_id
            JOIN continents cont ON cont.id = c.continent_id
            WHERE d.id = $1
            `,
            [params.destinationId]
          );

          trail.push(this.getExploreItem(false));
          trail.push(this.createBreadcrumb(
            destinationInfo.continent_name,
            `Explore ${destinationInfo.continent_name}`,
            URL_PATTERNS.CONTINENT(destinationInfo.continent_abbr),
            false
          ));
          trail.push(this.createBreadcrumb(
            destinationInfo.country_name,
            `Explore destinations in ${destinationInfo.country_name}`,
            URL_PATTERNS.COUNTRY(destinationInfo.continent_abbr, destinationInfo.country_abbr),
            false
          ));
          trail.push(this.createBreadcrumb(
            destinationInfo.destination_name,
            destinationInfo.destination_name,
            URL_PATTERNS.DESTINATION(destinationInfo.destination_id),
            true
          ));

          return {
            items: trail,
            currentPage: destinationInfo.destination_name
          };
        }

        default:
          throw new Error('Invalid page type');
      }
    } catch (error) {
      // Log the error and return home breadcrumb
      console.error('Breadcrumb generation error:', error);
      return {
        items: [this.getHomeItem()],
        currentPage: 'Home'
      };
    }
  }

  async getBreadcrumbs(pageType: string, identifier: string): Promise<BreadcrumbTrail> {
    // Parse the identifier based on pageType
    const params: { continentAbbr?: string; countryAbbr?: string; destinationId?: string } = {};
    
    switch (pageType) {
      case PAGE_TYPES.CONTINENT:
        params.continentAbbr = identifier;
        break;
      case PAGE_TYPES.COUNTRY: {
        const [contAbbr, cntryAbbr] = identifier.split('/');
        if (!contAbbr || !cntryAbbr) {
          throw new Error('Invalid country identifier format');
        }
        params.continentAbbr = contAbbr;
        params.countryAbbr = cntryAbbr;
        break;
      }
      case PAGE_TYPES.DESTINATION:
        params.destinationId = identifier;
        break;
    }

    const trail = await this.generateBreadcrumbs(pageType as PageType, params);
    return {
      items: trail.items,
      currentPage: trail.currentPage
    };
  }
} 