# Review Analysis Status

Check the current status of review tagging/analysis.

## Instructions

Run this query to get current status:

```bash
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function status() {
  const { count: total } = await supabase
    .from('review_data')
    .select('*', { count: 'exact', head: true })
    .not('review_text', 'is', null)
    .gt('review_text', '');

  const { count: analyzed } = await supabase
    .from('review_data')
    .select('*', { count: 'exact', head: true })
    .not('analysis_json', 'is', null);

  const remaining = (total || 0) - (analyzed || 0);
  const pct = ((analyzed || 0) / (total || 1) * 100).toFixed(1);

  console.log('=== Review Analysis Status ===');
  console.log('Total reviews with text:', total);
  console.log('Analyzed:', analyzed, '(' + pct + '%)');
  console.log('Remaining:', remaining);
}
status();
"
```

Report the results in a clean table format.
