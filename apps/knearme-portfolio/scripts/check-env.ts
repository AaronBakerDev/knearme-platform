
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('❌ URL is missing!');
} else {
    console.log('✅ URL is present:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}
