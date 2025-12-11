
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-dummy',
});

console.log('OpenAI Client keys:', Object.keys(openai));
// @ts-ignore
console.log('Has responses?', !!openai.responses);
// @ts-ignore
console.log('Has beta?', !!openai.beta);
// @ts-ignore
console.log('Has beta.chat.completions.parse?', !!openai.beta?.chat?.completions?.parse);
