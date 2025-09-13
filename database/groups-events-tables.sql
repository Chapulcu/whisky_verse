-- Groups and Events Database Schema
-- Create tables for groups and events functionality

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text,
    image_url text,
    category varchar(100), -- whisky_tasting, social, educational, etc.
    privacy varchar(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'members_only')),
    max_members integer DEFAULT 50,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role varchar(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title varchar(255) NOT NULL,
    description text,
    image_url text,
    event_type varchar(50), -- tasting, meetup, workshop, competition, etc.
    location varchar(255),
    virtual_link text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    max_participants integer DEFAULT 30,
    price decimal(10,2) DEFAULT 0,
    currency varchar(3) DEFAULT 'TRY',
    group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    status varchar(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled'))
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES events(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status varchar(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
    registered_at timestamp with time zone DEFAULT now(),
    payment_status varchar(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    UNIQUE(event_id, user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Groups are viewable by everyone" ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Group creators and admins can update groups" ON groups FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
CREATE POLICY "Group creators and admins can delete groups" ON groups FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- RLS Policies for group_members
CREATE POLICY "Group members are viewable by everyone" ON group_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join groups" ON group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can manage their own memberships" ON group_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for events
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Event creators and admins can update events" ON events FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
CREATE POLICY "Event creators and admins can delete events" ON events FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- RLS Policies for event_participants
CREATE POLICY "Event participants are viewable by everyone" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can register for events" ON event_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can manage their own event registrations" ON event_participants FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_category ON groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Insert some sample data for testing
INSERT INTO groups (name, description, category, created_by) VALUES
('İstanbul Viski Severler', 'İstanbul''da viski tutkunları için oluşturulan grup. Tadım etkinlikleri ve sosyal buluşmalar düzenliyoruz.', 'whisky_tasting', (SELECT id FROM auth.users WHERE email = 'admin@whiskyverse.com' LIMIT 1)),
('Scotch Whisky Meraklıları', 'Scotch viski odaklı tartışmalar ve tadım seansları.', 'educational', (SELECT id FROM auth.users WHERE email = 'admin@whiskyverse.com' LIMIT 1)),
('Başlangıç Seviyesi Viski Eğitimi', 'Yeni başlayanlar için viski dünyasına giriş.', 'educational', (SELECT id FROM auth.users WHERE email = 'admin@whiskyverse.com' LIMIT 1));

INSERT INTO events (title, description, event_type, location, start_date, end_date, max_participants, created_by, group_id) VALUES
('Macallan Tadım Gecesi', 'The Macallan''ın özel seçkilerini tadacağımız keyifli bir akşam.', 'tasting', 'İstanbul, Beyoğlu', 
 now() + interval '7 days', now() + interval '7 days' + interval '3 hours', 20, 
 (SELECT id FROM auth.users WHERE email = 'admin@whiskyverse.com' LIMIT 1),
 (SELECT id FROM groups WHERE name = 'İstanbul Viski Severler' LIMIT 1)),
('Viski ve Peynir Eşleştirmesi Workshop', 'Farklı viski türleri ile peynir eşleştirmelerini öğreneceğimiz workshop.', 'workshop', 'Ankara, Çankaya', 
 now() + interval '14 days', now() + interval '14 days' + interval '2 hours', 15, 
 (SELECT id FROM auth.users WHERE email = 'admin@whiskyverse.com' LIMIT 1),
 (SELECT id FROM groups WHERE name = 'Scotch Whisky Meraklıları' LIMIT 1)),
('Online Viski Tarihi Semineri', 'Viski''nin tarihçesi ve üretim süreçleri hakkında online seminer.', 'workshop', 'Online', 
 now() + interval '21 days', now() + interval '21 days' + interval '1.5 hours', 50, 
 (SELECT id FROM auth.users WHERE email = 'admin@whiskyverse.com' LIMIT 1),
 (SELECT id FROM groups WHERE name = 'Başlangıç Seviyesi Viski Eğitimi' LIMIT 1));