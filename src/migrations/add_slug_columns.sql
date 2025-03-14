-- Add slug columns
ALTER TABLE destinations ADD COLUMN slug VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE countries ADD COLUMN slug VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE continents ADD COLUMN slug VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE highlights ADD COLUMN slug VARCHAR(255) NOT NULL DEFAULT '';

-- Add unique constraints
ALTER TABLE destinations ADD CONSTRAINT destinations_slug_unique UNIQUE (slug);
ALTER TABLE countries ADD CONSTRAINT countries_slug_unique UNIQUE (slug);
ALTER TABLE continents ADD CONSTRAINT continents_slug_unique UNIQUE (slug);
ALTER TABLE highlights ADD CONSTRAINT highlights_slug_unique UNIQUE (slug); 