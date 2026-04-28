'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-ideal-customer-profile.ts';
import '@/ai/flows/analyze-market-niche-flow.ts';
import '@/ai/flows/generate-marketing-plan-flow.ts';
import '@/ai/flows/generate-creative-content-flow.ts';
import '@/ai/flows/predict-results-flow.ts';
