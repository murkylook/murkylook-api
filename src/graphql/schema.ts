import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type Continent {
    id: ID!
    name: String!
    code: String!
    visitCount: Int!
    countryCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    hidden: Boolean!
    imageUrl: String
    description: String
    countries: [Country!]!
  }

  type Country {
    id: ID!
    continentId: ID!
    name: String!
    isoCode: String!
    isoCode3: String!
    visitCount: Int!
    destinationCount: Int!
    imageUrl: String
    hidden: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    description: String
    continent: Continent!
    destinations: [Destination!]!
  }

  type DestinationType {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    iconName: String
    destinationCount: Int!
    destinations: [Destination!]!
  }

  type Destination {
    id: ID!
    countryId: ID!
    typeId: ID!
    name: String!
    description: String
    latitude: Float
    longitude: Float
    foundedYear: Int
    bestSeasonStart: Date
    bestSeasonEnd: Date
    visitCount: Int!
    highlightCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    imageUrl: String
    hidden: Boolean!
    country: Country!
    type: DestinationType!
    highlights: [Highlight!]!
  }

  type Highlight {
    id: ID!
    destinationId: ID!
    name: String!
    description: String
    seenCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    hidden: Boolean!
    imageUrl: String
    latitude: Float
    longitude: Float
    destination: Destination!
  }

  type User {
    id: ID!
    name: String!
    username: String!
    email: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    destinationVisits: [DestinationVisit!]!
    highlightViews: [HighlightView!]!
  }

  type DestinationVisit {
    id: ID!
    userId: ID!
    destinationId: ID!
    visitedAt: Date!
    createdAt: DateTime!
    user: User!
    destination: Destination!
  }

  type HighlightView {
    id: ID!
    userId: ID!
    highlightId: ID!
    seenAt: DateTime!
    user: User!
    highlight: Highlight!
  }

  type Language {
    id: ID!
    code: String!
    name: String!
    isDefault: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Translation {
    id: ID!
    tableName: String!
    columnName: String!
    rowId: Int!
    languageId: ID!
    translatedText: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    language: Language!
  }

  scalar DateTime
  scalar Date

  type Query {
    # Continents
    continents: [Continent!]!
    continent(id: ID!): Continent

    # Countries
    countries: [Country!]!
    country(id: ID!): Country
    countriesByContinent(continentId: ID!): [Country!]!

    # Destinations
    destinations: [Destination!]!
    destination(id: ID!): Destination
    destinationsByCountry(countryId: ID!): [Destination!]!
    destinationsByType(typeId: ID!): [Destination!]!

    # Destination Types
    destinationTypes: [DestinationType!]!
    destinationType(id: ID!): DestinationType

    # Highlights
    highlights: [Highlight!]!
    highlight(id: ID!): Highlight
    highlightsByDestination(destinationId: ID!): [Highlight!]!

    # Users
    users: [User!]!
    user(id: ID!): User
    userByEmail(email: String!): User

    # Visits and Views
    destinationVisits: [DestinationVisit!]!
    destinationVisitsByUser(userId: ID!): [DestinationVisit!]!
    highlightViews: [HighlightView!]!
    highlightViewsByUser(userId: ID!): [HighlightView!]!

    # Languages and Translations
    languages: [Language!]!
    language(id: ID!): Language
    translations: [Translation!]!
    translation(id: ID!): Translation
    translatedText(tableName: String!, columnName: String!, rowId: Int!, languageCode: String!): String
  }

  type Mutation {
    # Continent mutations
    createContinent(input: CreateContinentInput!): Continent!
    updateContinent(id: ID!, input: UpdateContinentInput!): Continent!
    deleteContinent(id: ID!): Boolean!

    # Country mutations
    createCountry(input: CreateCountryInput!): Country!
    updateCountry(id: ID!, input: UpdateCountryInput!): Country!
    deleteCountry(id: ID!): Boolean!

    # Destination mutations
    createDestination(input: CreateDestinationInput!): Destination!
    updateDestination(id: ID!, input: UpdateDestinationInput!): Destination!
    deleteDestination(id: ID!): Boolean!

    # Destination Type mutations
    createDestinationType(input: CreateDestinationTypeInput!): DestinationType!
    updateDestinationType(id: ID!, input: UpdateDestinationTypeInput!): DestinationType!
    deleteDestinationType(id: ID!): Boolean!

    # Highlight mutations
    createHighlight(input: CreateHighlightInput!): Highlight!
    updateHighlight(id: ID!, input: UpdateHighlightInput!): Highlight!
    deleteHighlight(id: ID!): Boolean!

    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    # Visit and View mutations
    createDestinationVisit(input: CreateDestinationVisitInput!): DestinationVisit!
    deleteDestinationVisit(id: ID!): Boolean!
    createHighlightView(input: CreateHighlightViewInput!): HighlightView!
    deleteHighlightView(id: ID!): Boolean!

    # Language mutations
    createLanguage(input: CreateLanguageInput!): Language!
    updateLanguage(id: ID!, input: UpdateLanguageInput!): Language!
    deleteLanguage(id: ID!): Boolean!

    # Translation mutations
    createTranslation(input: CreateTranslationInput!): Translation!
    updateTranslation(id: ID!, input: UpdateTranslationInput!): Translation!
    deleteTranslation(id: ID!): Boolean!
  }
`;
