import { IResolvers } from '@graphql-tools/utils';
import { CountryService } from '../../services/country.service';
import { Context } from '../../types/context';
import { Country } from '../../types/country';

export const countryResolvers: IResolvers = {
    Query: {
        country: async (_, { id }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.findById(id);
        },
        countries: async (_, { filter, pagination, orderBy }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.findAll({ filters: filter, pagination, orderBy });
        },

        countryStats: async (_, { id, period }, { pgPool }) => {
            const basicStats = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT d.id) as total_destinations
                FROM countries c
                LEFT JOIN destinations d ON d.country_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [id]);

            const visitsByPeriod = await pgPool.query(`
                SELECT 
                    DATE_TRUNC($1, v.visited_at) as period,
                    COUNT(*) as count
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                WHERE d.country_id = $2
                GROUP BY period
                ORDER BY period DESC
                LIMIT $3
            `, [period.period, id, period.count]);

            const topDestinations = await pgPool.query(`
                SELECT 
                    d.*,
                    COUNT(v.id) as visit_count
                FROM destinations d
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE d.country_id = $1
                GROUP BY d.id
                ORDER BY visit_count DESC
                LIMIT 5
            `, [id]);

            return {
                ...basicStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows,
                topDestinations: topDestinations.rows
            };
        },

        topCountriesByVisits: async (_, { limit = 10 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(v.id) as visit_count
                FROM countries c
                LEFT JOIN destinations d ON d.country_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                GROUP BY c.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        },

        countryByAbbreviation: async (_, { abbreviation }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.findByAbbreviation(abbreviation);
        },

        searchCountries: async (_, { term }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.search(term);
        }
    },

    Mutation: {
        createCountry: async (_, { input }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.create(input);
        },

        updateCountry: async (_, { id, input }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.update(id, input);
        },

        deleteCountry: async (_, { id }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.delete(id);
        }
    },

    Country: {

        continent: async (country: Country, _, { loaders }: Context) => {
            return loaders.continentLoader.load(country.continent_id);
        },

        destinations: async (country: Country, _, { pgPool, loaders }: Context) => {
            return loaders.destinationLoader.loadMany(
                (await pgPool.query('SELECT id FROM destinations WHERE country_id = $1', [country.id]))
                    .rows.map(row => row.id)
            );
        },

        stats: async (country: Country, _, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.getStats(country.id);
        }
    }
}; 