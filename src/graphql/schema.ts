import { gql } from 'graphql-tag';

export const typeDefs = gql`
  enum OrderBy {
    NAME_ASC
    NAME_DESC
    CREATED_AT_ASC
    CREATED_AT_DESC
    VISITS_DESC
    RATING_DESC
    POPULARITY
  }

  input PaginationInput {
    limit: Int
    offset: Int
  }

  input VisitPeriod {
    period: String!  # 'day', 'week', 'month', 'year'
    count: Int!
  }

  type Query {
    # Continent queries
    continent(id: ID!): Continent
    continents(filter: ContinentFilterInput, pagination: PaginationInput, orderBy: OrderBy): [Continent!]!
    continentByAbbreviation(abbreviation: String!): Continent
    searchContinents(term: String!): [Continent!]!
    continentStats(id: ID!, period: VisitPeriod): ContinentStats!
    topContinentsByVisits(limit: Int): [Continent!]!
    
    # Country queries
    country(id: ID!): Country
    countries(filter: CountryFilterInput, pagination: PaginationInput, orderBy: OrderBy): [Country!]!
    countryByAbbreviation(abbreviation: String!): Country
    searchCountries(term: String!): [Country!]!
    countryStats(id: ID!, period: VisitPeriod!): CountryStats!
    topCountriesByVisits(limit: Int): [Country!]!
    
    # Destination queries
    destination(id: ID!): Destination
    destinations(filter: DestinationFilterInput, pagination: PaginationInput, orderBy: OrderBy): [Destination!]!
    searchDestinations(term: String!): [Destination!]!
    nearbyDestinations(latitude: Float!, longitude: Float!, radiusKm: Float!): [Destination!]!
    destinationsByCountry(countryId: ID!): [Destination!]!
    destinationsByContinent(continentId: ID!): [Destination!]!
    featuredDestinations: [Destination!]!
    destinationStats(id: ID!, period: VisitPeriod!): DestinationStats!

    # Category queries
    category(id: ID!): Category
    categories(filter: CategoryFilterInput, pagination: PaginationInput, orderBy: OrderBy): [Category!]!
    searchCategories(term: String!): [Category!]!
    categoryStats(id: ID!, period: VisitPeriod): CategoryStats!
    popularCategories(limit: Int): [Category!]!

    # Visit queries
    visit(id: ID!): Visit
    visits(filter: VisitFilterInput, pagination: PaginationInput, orderBy: OrderBy): [Visit!]!
    visitsByUser(userId: ID!): [Visit!]!
    visitsByDestination(destinationId: ID!): [Visit!]!
    visitStats(period: VisitPeriod!): VisitStats!

    # User queries
    user(id: ID!): User
    users(filter: UserFilterInput, pagination: PaginationInput, orderBy: OrderBy): [User!]!
    userByEmail(email: String!): User
    userStats(id: ID!, period: VisitPeriod!): UserStats!
    mostActiveUsers(limit: Int): [User!]!

    # Statistics queries
    statistics: GlobalStats!
    visitTrends(period: String, limit: Int): [VisitTrend!]!
    topDestinations(limit: Int): [Destination!]!
    topCountries(limit: Int): [Country!]!
    globalStatistics: GlobalStats!
    trendingStatistics(days: Int): [TrendingStat!]!

    # Breadcrumb queries
    breadcrumbs(pageType: String!, identifier: String!): BreadcrumbTrail!
  }

  # Base types
  interface Node {
    id: ID!
    created_at: String!
    updated_at: String!
  }

  interface Stats {
    total_visits: Int!
  }

  # Continent types
  type Continent implements Node {
    id: ID!
    name: String!
    abbreviation: String!
    description: String
    image_url: String
    countries: [Country!]!
    stats: ContinentStats!
    created_at: String!
    updated_at: String!
  }

  type ContinentStats implements Stats {
    total_visits: Int!
    total_countries: Int!
    total_destinations: Int!
    visitsByPeriod: [VisitTrend!]
  }

  input ContinentInput {
    name: String!
    abbreviation: String!
    description: String
    image_url: String
  }

  input ContinentUpdateInput {
    name: String
    abbreviation: String
    description: String
    image_url: String
  }

  input ContinentFilterInput {
    search: String
    abbreviation: String
    ids: [ID!]
  }

  # Country types
  type Country implements Node {
    id: ID!
    name: String!
    abbreviation: String!
    description: String
    image_url: String
    continent: Continent!
    continent_id: ID!
    destinations: [Destination!]!
    stats: CountryStats!
    created_at: String!
    updated_at: String!
  }

  type CountryStats implements Stats {
    total_visits: Int!
    total_destinations: Int!
  }

  input CountryInput {
    name: String!
    abbreviation: String!
    description: String
    image_url: String
    continent_id: ID!
  }

  input CountryUpdateInput {
    name: String
    abbreviation: String
    description: String
    image_url: String
    continent_id: ID
  }

  input CountryFilterInput {
    search: String
    abbreviation: String
    continent_id: ID
    ids: [ID!]
  }

  # Destination types
  type Destination implements Node {
    id: ID!
    name: String!
    description: String
    latitude: Float
    longitude: Float
    country: Country!
    country_id: ID!
    categories: [Category!]!
    visits: [Visit!]!
    stats: DestinationStats!
    image_url: String
    recentVisitors: [User!]!
    created_at: String!
    updated_at: String!
  }

  type DestinationStats implements Stats {
    total_visits: Int!
    average_rating: Float!
  }

  input DestinationInput {
    name: String!
    description: String
    latitude: Float
    longitude: Float
    country_id: ID!
    category_ids: [ID!]
    image_url: String
  }

  input DestinationUpdateInput {
    name: String
    description: String
    latitude: Float
    longitude: Float
    country_id: ID
    category_ids: [ID!]
    image_url: String
  }

  input DestinationFilterInput {
    search: String
    country_id: ID
    category_id: ID
    latitude_min: Float
    latitude_max: Float
    longitude_min: Float
    longitude_max: Float
    ids: [ID!]
  }

  # Category types
  type Category implements Node {
    id: ID!
    name: String!
    description: String
    destinations: [Destination!]!
    stats: CategoryStats!
    created_at: String!
    updated_at: String!
  }

  type CategoryStats implements Stats {
    total_visits: Int!
    total_destinations: Int!
  }

  input CategoryInput {
    name: String!
    description: String
  }

  input CategoryUpdateInput {
    name: String
    description: String
  }

  input CategoryFilterInput {
    search: String
    ids: [ID!]
  }

  # Visit types
  type Visit implements Node {
    id: ID!
    user: User!
    user_id: ID!
    destination: Destination!
    destination_id: ID!
    visited_at: String!
    rating: Int
    notes: String
    stats: VisitStats!
    similarVisits: [Visit!]!
    created_at: String!
    updated_at: String!
  }

  type VisitStats {
    total_visits: Int!
    unique_visitors: Int!
    unique_destinations: Int!
    average_rating: Float!
    first_visit: String
    last_visit: String
    visits_by_period: [VisitTrend!]!
  }

  type VisitTrend {
    period: String!
    count: Int!
    unique_destinations: Int
  }

  input VisitInput {
    user_id: ID!
    destination_id: ID!
    visited_at: String!
    rating: Int
    notes: String
  }

  input VisitUpdateInput {
    visited_at: String
    rating: Int
    notes: String
  }

  input VisitFilterInput {
    user_id: ID
    destination_id: ID
    from_date: String
    to_date: String
    ids: [ID!]
  }

  # User types
  type User implements Node {
    id: ID!
    email: String!
    name: String!
    avatar_url: String
    visits: [Visit!]!
    stats: UserStats!
    recentVisits: [Visit!]!
    topCountries: [Country!]!
    recentActivity: [Visit!]!
    created_at: String!
    updated_at: String!
  }

  type UserStats implements Stats {
    total_visits: Int!
    unique_destinations: Int!
    countries_visited: Int!
    continents_visited: Int!
    visits_by_period: [VisitTrend!]!
  }

  input UserInput {
    email: String!
    name: String!
    avatar_url: String
  }

  input UserUpdateInput {
    email: String
    name: String
    avatar_url: String
  }

  input UserFilterInput {
    search: String
    email: String
    ids: [ID!]
  }

  # Statistics types
  type GlobalStats {
    total_users: Int!
    total_continents: Int!
    total_countries: Int!
    total_destinations: Int!
    total_visits: Int!
  }

  type TrendingStat {
    id: ID!
    name: String!
    country_name: String!
    visit_count: Int!
  }

  # Breadcrumb types
  type Breadcrumb {
    text: String!
    tooltip: String
    url: String!
    isActive: Boolean!
  }

  type BreadcrumbTrail {
    items: [Breadcrumb!]!
    currentPage: String!
  }

  input BreadcrumbParams {
    continentAbbr: String
    countryAbbr: String
    destinationId: String
  }

  type Mutation {
    # Continent mutations
    createContinent(input: ContinentInput!): Continent!
    updateContinent(id: ID!, input: ContinentUpdateInput!): Continent!
    deleteContinent(id: ID!): Boolean!

    # Country mutations
    createCountry(input: CountryInput!): Country!
    updateCountry(id: ID!, input: CountryUpdateInput!): Country!
    deleteCountry(id: ID!): Boolean!

    # Destination mutations
    createDestination(input: DestinationInput!): Destination!
    updateDestination(id: ID!, input: DestinationUpdateInput!): Destination!
    deleteDestination(id: ID!): Boolean!
    updateDestinationCategories(id: ID!, categoryIds: [ID!]!): Destination!

    # Category mutations
    createCategory(input: CategoryInput!): Category!
    updateCategory(id: ID!, input: CategoryUpdateInput!): Category!
    deleteCategory(id: ID!): Boolean!

    # Visit mutations
    createVisit(input: VisitInput!): Visit!
    updateVisit(id: ID!, input: VisitUpdateInput!): Visit!
    deleteVisit(id: ID!): Boolean!

    # User mutations
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserUpdateInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`; 