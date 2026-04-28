'use server';
/**
 * @fileOverview A Genkit flow for generating a comprehensive marketing plan based on business details, market analysis, and ideal customer profile.
 *
 * - generateMarketingPlan - A function that orchestrates the generation of a marketing plan.
 * - GenerateMarketingPlanInput - The input type for the generateMarketingPlan function.
 * - GenerateMarketingPlanOutput - The return type for the generateMarketingPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const GenerateMarketingPlanInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  companyDescription: z.string().describe('A detailed description of the company, its mission, and values.'),
  productsServices: z.string().describe('A description of the products or services offered by the company.'),
  marketingGoals: z.string().describe('Specific, measurable, achievable, relevant, and time-bound marketing goals for the company (e.g., increase brand awareness by 20% in 6 months, increase sales by 15% in Q3).'),
  nicheAnalysisSummary: z.string().describe('A summary of the identified market niche, including its size, growth potential, and key characteristics.'),
  competitorAnalysisSummary: z.string().describe('A summary of the competitor analysis, detailing key competitors, their strengths, weaknesses, and market positioning.'),
  idealCustomerProfileDescription: z.string().describe('A detailed description of the ideal customer profile, including demographics, psychographics, needs, pain points, and behaviors.'),
});
export type GenerateMarketingPlanInput = z.infer<typeof GenerateMarketingPlanInputSchema>;

const GenerateMarketingPlanOutputSchema = z.object({
  planTitle: z.string().describe('The title of the marketing plan.'),
  executiveSummary: z.string().describe('A concise overview of the marketing plan, highlighting key objectives, strategies, and expected outcomes.'),
  introduction: z.string().describe('An introduction to the company and its current market situation.'),
  targetMarketAnalysis: z.string().describe('An in-depth analysis of the target market, based on the ideal customer profile and niche analysis.'),
  competitiveLandscape: z.string().describe('An overview of the competitive landscape, including major competitors and their strategies.'),
  swotAnalysis: z.object({
    strengths: z.array(z.string()).describe('Strengths of the company.'),
    weaknesses: z.array(z.string()).describe('Weaknesses of the company.'),
    opportunities: z.array(z.string()).describe('Opportunities in the market for the company.'),
    threats: z.array(z.string()).describe('Threats to the company from the market or competitors.'),
  }).describe('A SWOT analysis for the company in the context of the market.'),
  marketingObjectives: z.array(z.string()).describe('Specific, measurable, achievable, relevant, and time-bound marketing objectives.'),
  marketingStrategies: z.array(z.object({
    strategyName: z.string().describe('Name of the marketing strategy.'),
    description: z.string().describe('Detailed description of the strategy.'),
    keyTactics: z.array(z.string()).describe('Key tactics for implementing this strategy.'),
  })).describe('Detailed marketing strategies, including descriptions and key tactics for implementation.'),
  budgetAllocation: z.string().describe('A general allocation of the marketing budget across different strategies and channels.'),
  timeline: z.string().describe('A proposed timeline for the implementation of the marketing plan (e.g., 3-month, 6-month, 12-month phases).'),
  keyPerformanceIndicators: z.array(z.object({
    kpiName: z.string().describe('Name of the Key Performance Indicator.'),
    description: z.string().describe('Description of what the KPI measures.'),
    targetValue: z.string().describe('The target value for this KPI.'),
  })).describe('Key Performance Indicators (KPIs) to measure the success of the marketing plan, including their descriptions and target values.'),
  conclusionAndRecommendations: z.string().describe('Concluding remarks and final recommendations for the business.'),
});
export type GenerateMarketingPlanOutput = z.infer<typeof GenerateMarketingPlanOutputSchema>;

export async function generateMarketingPlan(input: GenerateMarketingPlanInput): Promise<GenerateMarketingPlanOutput> {
  return generateMarketingPlanFlow(input);
}

const generateMarketingPlanPrompt = ai.definePrompt({
  name: 'generateMarketingPlanPrompt',
  input: { schema: GenerateMarketingPlanInputSchema },
  output: { schema: GenerateMarketingPlanOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `Eres un estratega de marketing experimentado, con una profunda comprensión de la creación de planes de marketing integrales y accionables. Tu tarea es generar un plan de marketing detallado y estratégico para una empresa, utilizando la información proporcionada.

El plan debe ser bien estructurado, claro, conciso y fácil de entender y ejecutar por el propietario del negocio.

Información de la empresa:
Nombre de la empresa: {{{companyName}}}
Descripción de la empresa: {{{companyDescription}}}
Productos/Servicios: {{{productsServices}}}
Objetivos de marketing: {{{marketingGoals}}}

Análisis de mercado:
Resumen del análisis de nicho: {{{nicheAnalysisSummary}}}
Resumen del análisis de la competencia: {{{competitorAnalysisSummary}}}
Descripción del perfil del cliente ideal (ICP): {{{idealCustomerProfileDescription}}}

Basándote en toda esta información, genera un plan de marketing completo que incluya las siguientes secciones:
1.  **Título del plan**: Un título pegadizo para el plan.
2.  **Resumen ejecutivo**: Una visión general concisa de los objetivos, estrategias y resultados esperados del plan.
3.  **Introducción**: Una breve presentación de la empresa y su situación actual en el mercado.
4.  **Análisis del mercado objetivo**: Un análisis detallado del mercado objetivo basado en el ICP y el análisis de nicho.
5.  **Panorama competitivo**: Una descripción de los principales competidores, sus fortalezas, debilidades y cómo la empresa se posicionará frente a ellos.
6.  **Análisis DAFO**: Un análisis de las Fortalezas, Oportunidades, Debilidades y Amenazas de la empresa.
7.  **Objetivos de marketing**: Objetivos SMART específicos, medibles, alcanzables, relevantes y con plazos definidos.
8.  **Estrategias de marketing**: Estrategias detalladas con tácticas clave para su implementación (por ejemplo, marketing de contenidos, SEO, redes sociales, email marketing, publicidad pagada, relaciones públicas).
9.  **Asignación de presupuesto**: Una asignación general del presupuesto de marketing entre las diferentes estrategias y canales.
10. **Cronograma**: Un cronograma propuesto para la implementación del plan.
11. **Indicadores clave de rendimiento (KPIs)**: KPIs para medir el éxito del plan, incluyendo sus descripciones y valores objetivo.
12. **Conclusión y recomendaciones**: Conclusiones finales y recomendaciones para la empresa.

Asegúrate de que el plan sea accionable y esté adaptado específicamente a la empresa y su contexto.`,
});

const generateMarketingPlanFlow = ai.defineFlow(
  {
    name: 'generateMarketingPlanFlow',
    inputSchema: GenerateMarketingPlanInputSchema,
    outputSchema: GenerateMarketingPlanOutputSchema,
  },
  async (input) => {
    const { output } = await generateMarketingPlanPrompt(input);
    if (!output) {
      throw new Error('Failed to generate marketing plan output.');
    }
    return output;
  }
);
