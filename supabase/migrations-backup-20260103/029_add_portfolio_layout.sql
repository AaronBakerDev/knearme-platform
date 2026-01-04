-- Add portfolio_layout column for AI-generated dynamic layouts
-- Stores design tokens and semantic blocks as JSON
-- See: src/lib/design/tokens.ts, src/lib/design/semantic-blocks.ts

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS portfolio_layout JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.portfolio_layout IS
  'AI-generated portfolio layout containing design tokens and semantic blocks. '
  'Structure: { tokens: DesignTokens, blocks: SemanticBlock[], rationale?: string }';

-- Create index for querying projects with custom layouts
CREATE INDEX IF NOT EXISTS idx_projects_has_portfolio_layout
  ON public.projects ((portfolio_layout IS NOT NULL))
  WHERE portfolio_layout IS NOT NULL;
