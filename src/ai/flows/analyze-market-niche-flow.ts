'use server';
/**
 * @fileOverview An AI agent for analyzing market niche and identifying competitors.
 *
 * - analyzeMarketNiche - A function that handles the market niche analysis process.
 * - AnalyzeMarketNicheInput - The input type for the analyzeMarketNiche function.
 * - AnalyzeMarketNicheOutput - The return type for the analyzeMarketNiche function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AnalyzeMarketNicheInputSchema = z.object({
  companyDescription: z.string().describe('A detailed description of the company, its mission, and values.'),
  productServiceDescription: z.string().describe('A detailed description of the products or services offered by the company.'),
  targetAudience: z.string().describe('A description of the primary target audience, including demographics, psychographics, and needs.'),
  location: z.string().optional().describe('The geographical location of the company (e.g., city, country). This will be used to prioritize finding local competitors.'),
});
export type AnalyzeMarketNicheInput = z.infer<typeof AnalyzeMarketNicheInputSchema>;

const AnalyzeMarketNicheOutputSchema = z.object({
  nicheAnalysis: z.string().describe('A comprehensive analysis of the identified market niche, including its size, growth potential, and specific characteristics.'),
  keyCompetitors: z.array(
    z.object({
      name: z.string().describe('The name of a key competitor.'),
      pricingModel: z.string().describe("Description of the competitor's pricing strategy or model."),
      channel: z.string().describe("The primary marketing or distribution channel used by the competitor."),
      strengths: z.string().describe("A description of the competitor's key strengths."),
      weaknesses: z.string().describe("A description of the competitor's key weaknesses."),
    })
  ).describe('A list of key competitors identified within the market niche, with structured details.'),
  uniqueSellingPropositionSuggestions: z.array(z.string()).describe('Suggestions for potential unique selling propositions (USPs) based on the niche and competition analysis.'),
  marketOpportunities: z.array(
    z.object({
        opportunity: z.string().describe("A potential market opportunity area (e.g., 'E-commerce', 'Content Marketing', 'Local SEO')."),
        score: z.number().min(1).max(10).describe("A score from 1 to 10 indicating the potential of this opportunity, where 10 is the highest potential."),
    })
  ).describe("A list of scorable market opportunities to visualize in a chart.")
});
export type AnalyzeMarketNicheOutput = z.infer<typeof AnalyzeMarketNicheOutputSchema>;

export async function analyzeMarketNiche(input: AnalyzeMarketNicheInput): Promise<AnalyzeMarketNicheOutput> {
  return analyzeMarketNicheFlow(input);
}

const analyzeMarketNichePrompt = ai.definePrompt({
  name: 'analyzeMarketNichePrompt',
  input: { schema: AnalyzeMarketNicheInputSchema },
  output: { schema: AnalyzeMarketNicheOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `Eres un analista de mercado experto con una profunda comprensión de la identificación de nichos, el análisis de la competencia y las oportunidades de mercado. Tu tarea es analizar la información proporcionada sobre una empresa para generar un análisis exhaustivo.

Aquí está la información de la empresa:

Descripción de la empresa: {{{companyDescription}}}
Descripción del producto/servicio: {{{productServiceDescription}}}
Público objetivo: {{{targetAudience}}}
{{#if location}}Ubicación de la empresa: {{{location}}}{{/if}}

Basándote en esta información, realiza las siguientes tareas:
1.  **Análisis del nicho de mercado**: Describe en profundidad el nicho de mercado identificado, incluyendo su tamaño, potencial de crecimiento, características específicas y por qué esta empresa encaja o puede encajar en él.
2.  **Identificación de competidores clave**: Enumera y describe a los principales competidores dentro de este nicho. Para cada competidor, proporciona su nombre y detalles estructurados sobre su modelo de precios, canales de marketing principales, fortalezas y debilidades. {{#if location}}Si se proporciona una ubicación, prioriza la identificación de competidores locales en esa área geográfica.{{/if}}
3.  **Sugerencias de propuestas de venta únicas (USPs)**: Basándote en el análisis del nicho y la competencia, sugiere al menos 3 posibles propuestas de venta únicas (USPs) que la empresa podría adoptar para diferenciarse.
4.  **Análisis de Oportunidades de Mercado**: Identifica entre 4 y 6 áreas de oportunidad clave para la empresa en el nicho analizado. Para cada oportunidad, proporciona un nombre (ej. 'Marketing de Contenidos', 'SEO Local', 'Colaboraciones con Influencers') y una puntuación del 1 al 10 que represente su potencial de impacto, donde 10 es el máximo potencial. Esto se usará para generar un gráfico.

Asegúrate de que la salida esté en formato JSON, siguiendo el esquema proporcionado.`,
});

const analyzeMarketNicheFlow = ai.defineFlow(
  {
    name: 'analyzeMarketNicheFlow',
    inputSchema: AnalyzeMarketNicheInputSchema,
    outputSchema: AnalyzeMarketNicheOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeMarketNichePrompt(input);
    if (!output) {
      throw new Error('No output received from the market niche analysis prompt.');
    }
    return output;
  }
);
