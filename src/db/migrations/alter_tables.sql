-- Add updated_at to destination_visits
ALTER TABLE destination_visits
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add timestamps to highlight_views
ALTER TABLE highlight_views
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add password and other useful fields to users
ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255) NOT NULL,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN role VARCHAR(50) DEFAULT 'user',
ADD COLUMN avatar_url VARCHAR(255),
ADD COLUMN bio TEXT,
ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- Add trigger for updating updated_at in destination_visits
CREATE OR REPLACE FUNCTION update_destination_visits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_destination_visits_updated_at
    BEFORE UPDATE ON destination_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_destination_visits_updated_at();

-- Add trigger for updating updated_at in highlight_views
CREATE OR REPLACE FUNCTION update_highlight_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_highlight_views_updated_at
    BEFORE UPDATE ON highlight_views
    FOR EACH ROW
    EXECUTE FUNCTION update_highlight_views_updated_at(); 