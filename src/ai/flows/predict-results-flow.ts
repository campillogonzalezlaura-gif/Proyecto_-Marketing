'use server';
/**
 * @fileOverview A Genkit flow for predicting marketing results based on business data.
 *
 * - predictResults - A function that handles the prediction process.
 * - PredictResultsInput - The input type for the predictResults function.
 * - PredictResultsOutput - The return type for the predictResults function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';

const PredictResultsInputSchema = z.object({
  companyDescription: z.string().describe('Detailed description of the company, its industry, size, and objectives.'),
  productDescription: z.string().describe('Description of the main product or service, including its price if available.'),
  marketingBudget: z.number().describe('The allocated monthly marketing budget.'),
  nicheAnalysis: z.string().describe('A summary of the market niche analysis, including key characteristics and potential.'),
  idealCustomerProfile: z.string().describe('A detailed description of the ideal customer profile (demographics, psychographics, pain points).'),
});
export type PredictResultsInput = z.infer<typeof PredictResultsInputSchema>;

const PredictResultsOutputSchema = z.object({
  estimatedSales: z.object({
    value: z.number().describe('The estimated monthly sales figure in currency.'),
    explanation: z.string().describe('A brief explanation of how the sales estimate was calculated.'),
  }).describe('The estimated monthly sales.'),
  estimatedConversionRate: z.object({
    value: z.number().describe('The estimated monthly conversion rate as a percentage (e.g., for 2.5% return 2.5).'),
    explanation: z.string().describe('A brief explanation of how the conversion rate estimate was calculated.'),
  }).describe('The estimated monthly conversion rate.'),
  estimatedReach: z.object({
    value: z.number().describe('The estimated number of people reached per month.'),
    explanation: z.string().describe('A brief explanation of how the reach estimate was calculated.'),
  }).describe('The estimated monthly reach.'),
  estimatedCostPerLead: z.object({
    value: z.number().describe('The estimated cost to acquire a single lead.'),
    explanation: z.string().describe('A brief explanation of how the cost per lead estimate was calculated.'),
  }).describe('The estimated cost per lead (CPL).'),
  marketScenarios: z.array(z.object({
    scenario: z.enum(['Pesimista', 'Realista', 'Optimista']).describe("The name of the scenario."),
    description: z.string().describe('A description of what could happen in this market scenario and its impact on the results.'),
  })).describe('Analysis of pessimistic, realistic, and optimistic market scenarios.'),
});
export type PredictResultsOutput = z.infer<typeof PredictResultsOutputSchema>;

export async function predictResults(input: PredictResultsInput): Promise<PredictResultsOutput> {
  return predictResultsFlow(input);
}

const predictResultsPrompt = ai.definePrompt({
  name: 'predictResultsPrompt',
  input: { schema: PredictResultsInputSchema },
  output: { schema: PredictResultsOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `Eres un analista de marketing digital y estratega de negocio con 20 años de experiencia. Tu tarea es realizar una predicción de resultados de marketing basada en los datos de una empresa. Debes proporcionar estimaciones cuantificables y realistas, explicando brevemente tu razonamiento para cada una.

Aquí está la información de la empresa:
- Descripción y Objetivos: {{{companyDescription}}}
- Producto/Servicio: {{{productDescription}}}
- Presupuesto de Marketing Mensual: €{{{marketingBudget}}}
- Análisis del Nicho de Mercado: {{{nicheAnalysis}}}
- Perfil del Cliente Ideal: {{{idealCustomerProfile}}}

Basándote en esta información, genera una predicción que incluya:
1.  **Ventas Estimadas Mensuales (€):** Una cifra de ventas realista y una explicación concisa del cálculo. Considera el presupuesto, el nicho y el posible precio del producto.
2.  **Tasa de Conversión Estimada Mensual (%):** El porcentaje de usuarios que realizan una acción clave sobre el total del alcance y tu razonamiento.
3.  **Alcance Estimado Mensual:** El número de personas que se estima alcanzar con las campañas de marketing y por qué.
4.  **Coste por Lead Estimado (€):** El coste aproximado para adquirir un nuevo cliente potencial (lead) y cómo llegaste a esa cifra.
5.  **Escenarios de Mercado:** Describe tres escenarios (Pesimista, Realista, Optimista), explicando qué factores podrían llevar a cada uno y cómo afectarían los resultados.

Sé conservador pero fundamentado en tus estimaciones. La salida debe estar en formato JSON.`,
});

const predictResultsFlow = ai.defineFlow(
  {
    name: 'predictResultsFlow',
    inputSchema: PredictResultsInputSchema,
    outputSchema: PredictResultsOutputSchema,
  },
  async (input) => {
    const { output } = await predictResultsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate results prediction.');
    }
    return output;
  }
);
