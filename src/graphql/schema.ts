import { gql } from 'apollo-server-express';

/**
 * GraphQL Schema Definitions
 * Defines the structure of our API including:
 * - Types
 * - Queries
 * - Mutations
 * - Input types
 * - Custom scalars
 */

// Define our GraphQL schema using SDL (Schema Definition Language)
export const typeDefs = gql`
    """
    Custom scalar for handling dates
    """
    scalar DateTime

    """
    Period input for statistical queries
    Example: { period: "month", count: 12 }
    """
    input PeriodInput {
        period: String!  # day, week, month, year
        count: Int!     # number of periods to return
    }

    """
    Date range input for filtering
    """
    input DateRangeInput {
        start: DateTime
        end: DateTime
    }

    type Continent {
        id: ID!
        name: String!
        abbreviation: String!
        description: String
        created_at: DateTime!
        updated_at: DateTime!
        total_countries: Int!
        total_destinations: Int!
        image_url: String
        total_visits: Int!
        # Relationships
        countries: [Country!]!
    }

    type Country {
        id: ID!
        name: String!
        abbreviation: String!
        description: String
        continent_id: ID!
        created_at: DateTime!
        updated_at: DateTime!
        total_destinations: Int!
        image_url: String
        flag_url: String
        subregion: String
        total_visits: Int!
        # Relationships
        continent: Continent!
        destinations: [Destination!]!
    }

    type DestinationCategory {
        id: ID!
        name: String!
        created_at: DateTime!
        destination_count: Int!
        # Relationships
        destinations: [Destination!]!
    }

    type DestinationStats {
        id: ID!
        destination_id: ID!
        views_count: Int!
        likes_count: Int!
        wishlist_count: Int!
        visit_count: Int!
        avg_rating: Float
        last_updated: DateTime!
        # Relationships
        destination: Destination!
    }

    type Destination {
        id: ID!
        name: String!
        description: String
        country_id: ID!
        created_at: DateTime!
        updated_at: DateTime!
        latitude: Float
        longitude: Float
        image_url: String
        category_id: ID!
        # Relationships
        country: Country!
        category: DestinationCategory!
        stats: DestinationStats
        visits: [Visit!]!
    }

    type User {
        id: ID!
        username: String!
        created_at: DateTime!
        updated_at: DateTime!
        auth0_id: String!
        email: String!
        email_verified: Boolean!
        picture: String
        nickname: String
        last_login: DateTime
        locale: String
        # Relationships
        visits: [Visit!]!
    }

    type Visit {
        id: ID!
        user_id: ID!
        destination_id: ID!
        visited_at: DateTime!
        created_at: DateTime!
        updated_at: DateTime!
        # Relationships
        user: User!
        destination: Destination!
    }

    # Input types for filtering
    input DateRange {
        start: DateTime!
        end: DateTime!
    }

    input DestinationFilter {
        categoryId: ID
        countryId: ID
        continentId: ID
        searchTerm: String
        visitedBetween: DateRange
        hasImage: Boolean
    }

    input StatsPeriod {
        period: String!  # 'day', 'week', 'month', 'year'
        count: Int!     # how many periods back
    }

    # Input type for creating a new visit
    input CreateVisitInput {
        destinationId: ID!
        visitedAt: DateTime
    }

    # Query type with all possible queries
    type Query {
        # Continent queries
        continent(id: ID!): Continent
        continents(
            searchTerm: String
            orderBy: String
        ): [Continent!]!
        continentStats(id: ID!, period: StatsPeriod): ContinentStats!
        topContinentsByVisits(limit: Int = 5): [Continent!]!

        # Country queries
        country(id: ID!): Country
        countries(
            continentId: ID
            searchTerm: String
            orderBy: String
        ): [Country!]!
        countryStats(id: ID!, period: StatsPeriod): CountryStats!
        topCountriesByVisits(
            continentId: ID
            limit: Int = 10
        ): [Country!]!

        # Destination queries
        destination(id: ID!): Destination
        destinations(
            filter: DestinationFilter
            limit: Int = 10
            offset: Int = 0
            orderBy: String
        ): DestinationConnection!
        
        searchDestinations(
            term: String!
            limit: Int = 10
            offset: Int = 0
        ): DestinationConnection!

        popularDestinations(
            categoryId: ID
            countryId: ID
            continentId: ID
            limit: Int = 10
        ): [Destination!]!

        recentlyVisitedDestinations(
            limit: Int = 10
        ): [Destination!]!

        # Category queries
        destinationCategory(id: ID!): DestinationCategory
        destinationCategories(
            orderBy: String
        ): [DestinationCategory!]!
        categoryStats(id: ID!, period: StatsPeriod): CategoryStats!

        # User queries
        user(id: ID!): User
        userByAuth0Id(auth0Id: String!): User
        userStats(id: ID!): UserStats!
        userVisits(
            userId: ID!
            limit: Int = 10
            offset: Int = 0
        ): VisitConnection!

        # Visit queries
        visit(id: ID!): Visit
        recentVisits(
            limit: Int = 10
            offset: Int = 0
        ): VisitConnection!

        # Statistics queries
        globalStats: GlobalStats!
        trendingDestinations(
            period: StatsPeriod
            limit: Int = 10
        ): [Destination!]!
    }

    # Connection types for pagination
    type DestinationConnection {
        edges: [DestinationEdge!]!
        pageInfo: PageInfo!
        totalCount: Int!
    }

    type DestinationEdge {
        node: Destination!
        cursor: String!
    }

    type VisitConnection {
        edges: [VisitEdge!]!
        pageInfo: PageInfo!
        totalCount: Int!
    }

    type VisitEdge {
        node: Visit!
        cursor: String!
    }

    type PageInfo {
        hasNextPage: Boolean!
        hasPreviousPage: Boolean!
        startCursor: String
        endCursor: String
    }

    # Statistics types
    type GlobalStats {
        totalUsers: Int!
        totalVisits: Int!
        totalDestinations: Int!
        totalCountries: Int!
        totalContinents: Int!
        mostVisitedDestination: Destination
        mostActiveUser: User
        recentVisitsCount: Int!
        averageVisitsPerUser: Float!
    }

    type ContinentStats {
        totalVisits: Int!
        visitsByPeriod: [PeriodStat!]!
        topCountries: [Country!]!
        topDestinations: [Destination!]!
        averageVisitsPerCountry: Float!
    }

    type CountryStats {
        totalVisits: Int!
        visitsByPeriod: [PeriodStat!]!
        topDestinations: [Destination!]!
        averageVisitsPerDestination: Float!
        visitorsByContinent: [ContinentVisitors!]!
    }

    type CategoryStats {
        totalDestinations: Int!
        totalVisits: Int!
        visitsByPeriod: [PeriodStat!]!
        topDestinations: [Destination!]!
        averageVisitsPerDestination: Float!
    }

    type UserStats {
        totalVisits: Int!
        uniqueCountries: Int!
        uniqueContinents: Int!
        visitsByPeriod: [PeriodStat!]!
        mostVisitedCountry: Country
        mostVisitedContinent: Continent
        visitsByCategory: [CategoryVisits!]!
    }

    type PeriodStat {
        period: String!
        count: Int!
    }

    type ContinentVisitors {
        continent: Continent!
        visitorCount: Int!
    }

    type CategoryVisits {
        category: DestinationCategory!
        visitCount: Int!
    }

    type Mutation {
        """
        Records a new visit to a destination
        """
        createVisit(input: CreateVisitInput!): Visit!
    }
`; 