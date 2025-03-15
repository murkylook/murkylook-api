import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type HomeStats {
    totalDestinations: Int!
    totalCountries: Int!
    totalHighlights: Int!
    totalUsers: Int!
    totalVisits: Int!
    totalViews: Int!
  }

  type ActiveStats {
    recentVisits: Int!
    recentViews: Int!
    activeUsers: Int!
  }

  type Continent {
    id: ID!
    name: String!
    slug: String!
    code: String!
    description: String
    image_url: String
    country_count: Int!
    visit_count: Int!
    countries: [Country!]!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Country {
    id: ID!
    name: String!
    slug: String!
    iso_code: String!
    iso_code3: String!
    description: String
    image_url: String
    continent: Continent!
    destinations: [Destination!]!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type DestinationType {
    id: ID!
    name: String!
    description: String
    icon_name: String
    destination_count: Int!
    destinations: [Destination!]!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Destination {
    id: ID!
    name: String!
    slug: String!
    description: String
    country: Country!
    type: DestinationType!
    highlights: [Highlight!]!
    latitude: Float
    longitude: Float
    image_url: String
    founded_year: Int
    best_season_start: Int
    best_season_end: Int
    visit_count: Int!
    highlight_count: Int!
    visitStats: DestinationVisitStats!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Highlight {
    id: ID!
    name: String!
    slug: String!
    description: String
    destination: Destination!
    seen_count: Int!
    image_url: String
    latitude: Float
    longitude: Float
    viewStats: HighlightViewStats!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    avatar_url: String
    bio: String
    preferences: JSON
    is_active: Boolean!
    last_login_at: DateTime
    role: String!
    destinationVisits: [DestinationVisit!]!
    highlightViews: [HighlightView!]!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type DestinationVisit {
    id: ID!
    user: User!
    destination: Destination!
    visited_at: DateTime!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type HighlightView {
    id: ID!
    user: User!
    highlight: Highlight!
    seen_at: DateTime!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type DestinationVisitStats {
    total_visits: Int!
    unique_visitors: Int!
    last_visit: DateTime
  }

  type HighlightViewStats {
    total_views: Int!
    unique_viewers: Int!
    last_view: DateTime
  }

  type Language {
    id: ID!
    name: String!
    code: String!
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type Translation {
    id: ID!
    language: Language!
    table_name: String!
    row_id: ID!
    column_name: String!
    value: String!
    created_at: DateTime!
    updated_at: DateTime!
  }

  type AuthResponse {
    user: User!
    token: String!
  }

  type SearchResult {
    type: String!
    id: Int!
    name: String!
    description: String
    score: Float!
  }

  type Query {
    # Home stats queries
    stats: HomeStats!
    activeStats: ActiveStats!
    featuredDestinations: [Destination!]!
    
    # Continent queries
    continents: [Continent!]!
    continentById(id: ID!): Continent
    continentByCode(code: String!): Continent
    continentBySlug(slug: String!): Continent

    # Country queries
    countries: [Country!]!
    countryById(id: ID!): Country
    countryByIso(isoCode: String!): Country
    countryByIso3(iso3Code: String!): Country
    countryByName(name: String!): Country
    countryBySlug(slug: String!): Country

    # Destination queries
    destinations: [Destination!]!
    destination(id: ID!): Destination
    destinationsByCountry(countryId: ID!): [Destination!]!
    destinationsByType(typeId: ID!): [Destination!]!
    destinationVisitsByUser(userId: ID!): [DestinationVisit!]!
    destinationVisitsByDestination(destinationId: ID!): [DestinationVisit!]!
    destinationBySlug(slug: String!): Destination

    # Destination type queries
    destinationTypes: [DestinationType!]!
    destinationType(id: ID!): DestinationType
    destinationTypeByName(name: String!): DestinationType

    # Highlight queries
    highlights: [Highlight!]!
    highlight(id: ID!): Highlight
    highlightsByDestination(destinationId: ID!): [Highlight!]!
    highlightsByLocation(latitude: Float!, longitude: Float!, radiusKm: Float!): [Highlight!]!
    highlightViewsByUser(userId: ID!): [HighlightView!]!
    highlightViewsByHighlight(highlightId: ID!): [HighlightView!]!
    highlightBySlug(slug: String!): Highlight

    # User queries
    users: [User!]!
    user(id: ID!): User
    userByUsername(username: String!): User
    userByEmail(email: String!): User

    # Language queries
    languages: [Language!]!
    language(id: ID!): Language
    languageByCode(code: String!): Language

    # Translation queries
    translations: [Translation!]!
    translation(id: ID!): Translation
    translationsByLanguage(languageId: ID!): [Translation!]!
    translationsByTableAndRow(tableName: String!, rowId: ID!): [Translation!]!
    translationsByTableRowAndColumn(tableName: String!, rowId: ID!, columnName: String!): [Translation!]!
    translationByTableRowColumnAndLanguage(
      tableName: String!
      rowId: ID!
      columnName: String!
      languageId: ID!
    ): Translation

    # Auth queries
    me: User

    # Search queries
    search(query: String!): [SearchResult!]!
  }

  type Mutation {
    # Visit/View mutations
    recordDestinationVisit(userId: ID!, destinationId: ID!): DestinationVisit!
    recordHighlightView(userId: ID!, highlightId: ID!): HighlightView!

    # Auth mutations
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    logout: Boolean!
  }

  input RegisterInput {
    name: String!
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  scalar DateTime
  scalar JSON
`;
