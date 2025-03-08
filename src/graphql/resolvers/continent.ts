import { IResolvers } from '@graphql-tools/utils';
import { ContinentService } from '../../services/continent.service';
import { Context } from '../../types/context';
import { Continent } from '../../types/continent';

export const continentResolvers: IResolvers = {
    Query: {
        continent: async (_, { id }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.findById(id);
        },

        continentByAbbreviation: async (_, { abbreviation }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.findByAbbreviation(abbreviation);
        },

        continents: async (_, { filter, pagination, orderBy }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.findAll({ filters: filter, pagination, orderBy });
        },

        searchContinents: async (_, { term }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.search(term);
        },

    
        continentStats: async (_, { id, period }, { pgPool }) => {
            const basicStats = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(DISTINCT co.id) as total_countries
                FROM continents c
                LEFT JOIN countries co ON co.continent_id = c.id AND co.hidden = false
                LEFT JOIN destinations d ON d.country_id = co.id AND d.hidden = false
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1 AND c.hidden = false
                GROUP BY c.id
            `, [id]);

            let visitsByPeriod = [];
            if (period) {
                const periodResult = await pgPool.query(`
                    SELECT 
                        DATE_TRUNC($1, v.visited_at) as period,
                        COUNT(*) as count
                    FROM visits v
                    JOIN destinations d ON d.id = v.destination_id AND d.hidden = false
                    JOIN countries co ON co.id = d.country_id AND co.hidden = false
                    WHERE co.continent_id = $2
                    GROUP BY period
                    ORDER BY period DESC
                    LIMIT $3
                `, [period.period, id, period.count]);
                visitsByPeriod = periodResult.rows;
            }

            return {
                ...basicStats.rows[0],
                visitsByPeriod
            };
        },

        topContinentsByVisits: async (_, { limit }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(v.id) as visit_count
                FROM continents c
                LEFT JOIN countries co ON co.continent_id = c.id AND co.hidden = false
                LEFT JOIN destinations d ON d.country_id = co.id AND d.hidden = false
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.hidden = false
                GROUP BY c.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        }
    },

    Mutation: {
        createContinent: async (_, { input }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.create(input);
        },

        updateContinent: async (_, { id, input }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.update(id, input);
        },

        deleteContinent: async (_, { id }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.delete(id);
        }
    },

    Continent: {
        countries: async (continent: Continent, _, { pgPool, loaders }: Context) => {
            const countryIds = (await pgPool.query(
                'SELECT id FROM countries WHERE continent_id = $1 AND hidden = false ORDER BY name ASC',
                [continent.id]
            )).rows.map(row => row.id);
            
            const countries = await loaders.countryLoader.loadMany(countryIds);
            // Maintain the order from the query and filter out any errors
            return countryIds.map(id => 
                countries.find(c => c instanceof Error ? false : c.id === id)
            ).filter(c => c && !(c instanceof Error));
        },

        stats: async (continent: Continent, _, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.getStats(continent.id);
        }
    }
}; 