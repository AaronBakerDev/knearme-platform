# Import Batch Results

Import the completed batch tagging results from Google AI Studio.

## Instructions

1. First, check if a batch output file exists in the project directory:
   - Look for files matching `batch_output*.jsonl` or downloaded from AI Studio

2. If no file exists, ask the user:
   - "Have you downloaded the batch results from https://aistudio.google.com/batches?"
   - "What's the filename of the downloaded results?"

3. Once you have the file path, run the import:
   ```bash
   npx tsx src/scripts/batch-tag-reviews.ts --import <filename>
   ```

4. After import completes, verify the results:
   ```bash
   npx tsx -e "
   import { createClient } from '@supabase/supabase-js';
   import * as dotenv from 'dotenv';
   dotenv.config();
   const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
   async function check() {
     const { count } = await supabase
       .from('review_data')
       .select('*', { count: 'exact', head: true })
       .not('analysis_json', 'is', null);
     console.log('Total reviews with analysis:', count);
   }
   check();
   "
   ```

5. Report the final count to the user.
