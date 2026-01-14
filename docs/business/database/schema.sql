-- KnearMe Contractor Stories Database Schema

-- Contractors table
CREATE TABLE contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  specialties TEXT, -- JSON array of specialties
  years_experience INTEGER,
  license_number TEXT,
  insurance_verified BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  website_url TEXT,
  subscription_plan TEXT DEFAULT 'basic', -- basic, pro, premium
  subscription_status TEXT DEFAULT 'active', -- active, canceled, suspended
  subscription_expires_at DATETIME,
  onboarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project stories table
CREATE TABLE project_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  story_content TEXT NOT NULL, -- Full story in HTML
  excerpt TEXT NOT NULL, -- Short description for listings
  project_type TEXT NOT NULL, -- excavation, post_holes, foundation, etc.
  project_location TEXT NOT NULL,
  project_value_range TEXT, -- under_5k, 5k_15k, 15k_50k, over_50k
  duration_days INTEGER,
  equipment_used TEXT, -- JSON array
  challenges TEXT, -- JSON array of challenges faced
  solutions TEXT, -- JSON array of solutions implemented
  client_type TEXT, -- residential, commercial, municipal
  seo_keywords TEXT, -- JSON array for SEO
  meta_description TEXT,
  featured_image_url TEXT,
  gallery_images TEXT, -- JSON array of image URLs
  interview_transcript TEXT, -- Raw interview data
  ai_confidence_score REAL DEFAULT 0.0,
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractors (id)
);

-- AI interviews table
CREATE TABLE ai_interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contractor_id INTEGER NOT NULL,
  interview_type TEXT DEFAULT 'project_story', -- project_story, profile_update
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, failed
  scheduled_for DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  questions_asked TEXT, -- JSON array of questions
  responses TEXT, -- JSON array of responses
  transcript TEXT, -- Full conversation transcript
  ai_notes TEXT, -- AI observations and follow-up needs
  story_id INTEGER, -- If this interview resulted in a story
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES contractors (id),
  FOREIGN KEY (story_id) REFERENCES project_stories (id)
);

-- Team member access
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- admin, interviewer, writer, editor
  agent_type TEXT, -- human, ai_claude, ai_gpt4, ai_gemini
  permissions TEXT, -- JSON array of permissions
  active BOOLEAN DEFAULT TRUE,
  last_active_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email templates for team communication
CREATE TABLE email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables TEXT, -- JSON array of template variables
  template_type TEXT NOT NULL, -- welcome, interview_reminder, story_published
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and tracking
CREATE TABLE page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER,
  contractor_id INTEGER,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  search_query TEXT,
  session_id TEXT,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES project_stories (id),
  FOREIGN KEY (contractor_id) REFERENCES contractors (id)
);

-- Search keywords and SEO tracking
CREATE TABLE seo_keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  competition TEXT DEFAULT 'unknown', -- low, medium, high
  location TEXT, -- city, state for local SEO
  story_id INTEGER,
  ranking_position INTEGER,
  last_checked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES project_stories (id)
);

-- Indexes for performance
CREATE INDEX idx_contractors_city_state ON contractors(city, state);
CREATE INDEX idx_contractors_specialties ON contractors(specialties);
CREATE INDEX idx_contractors_subscription ON contractors(subscription_status, subscription_expires_at);

CREATE INDEX idx_stories_contractor ON project_stories(contractor_id);
CREATE INDEX idx_stories_published ON project_stories(published, published_at);
CREATE INDEX idx_stories_location ON project_stories(project_location);
CREATE INDEX idx_stories_type ON project_stories(project_type);
CREATE INDEX idx_stories_slug ON project_stories(slug);

CREATE INDEX idx_interviews_contractor ON ai_interviews(contractor_id);
CREATE INDEX idx_interviews_status ON ai_interviews(status, scheduled_for);

CREATE INDEX idx_views_story ON page_views(story_id, viewed_at);
CREATE INDEX idx_views_session ON page_views(session_id, viewed_at);

CREATE INDEX idx_keywords_story ON seo_keywords(story_id);
CREATE INDEX idx_keywords_location ON seo_keywords(location, keyword);

-- Insert initial team members
INSERT INTO team_members (email, name, role, agent_type, permissions) VALUES
('admin@knearme.co', 'Admin Agent', 'admin', 'human', '["all"]'),
('interviewer@knearme.co', 'AI Interviewer', 'interviewer', 'ai_gpt4', '["interview", "schedule", "follow_up"]'),
('writer@knearme.co', 'Story Writer Agent', 'writer', 'ai_claude', '["write", "edit", "publish"]'),
('outreach@knearme.co', 'Outreach Agent', 'editor', 'ai_gemini', '["research", "outreach", "analytics"]'),
('manager@knearme.co', 'Operations Manager', 'admin', 'ai_gpt4', '["manage", "coordinate", "report"]');

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables, template_type) VALUES
(
  'contractor_welcome',
  'Welcome to KnearMe - Let''s Share Your Story!',
  '<h1>Welcome {{company_name}}!</h1><p>We''re excited to showcase your excavation expertise through compelling project stories.</p>',
  'Welcome {{company_name}}! We''re excited to showcase your excavation expertise through compelling project stories.',
  '["company_name", "contact_name", "interviewer_name"]',
  'welcome'
),
(
  'interview_reminder',
  'Your KnearMe Story Interview is Tomorrow',
  '<h1>Interview Reminder</h1><p>Hi {{contact_name}}, your story interview is scheduled for {{interview_time}}.</p>',
  'Hi {{contact_name}}, your story interview is scheduled for {{interview_time}}.',
  '["contact_name", "interview_time", "interview_link"]',
  'interview_reminder'
),
(
  'story_published',
  'Your Project Story is Live on KnearMe!',
  '<h1>Your Story is Live!</h1><p>Check out your published story: {{story_url}}</p>',
  'Your story is live! Check it out: {{story_url}}',
  '["company_name", "story_title", "story_url"]',
  'story_published'
);

-- Insert sample contractor specialties and project types for reference
-- This helps with categorization and search functionality