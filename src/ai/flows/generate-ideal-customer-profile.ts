'use server';
/**
 * @fileOverview A Genkit flow for generating a detailed Ideal Customer Profile (ICP) based on business and target audience information.
 *
 * - generateIdealCustomerProfile - A function that handles the ICP generation process.
 * - IdealCustomerProfileInput - The input type for the generateIdealCustomerProfile function.
 * - IdealCustomerProfileOutput - The return type for the generateIdealCustomerProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const IdealCustomerProfileInputSchema = z.object({
  businessDescription: z
    .string()
    .describe('Descripción general del negocio o empresa.'),
  targetAudienceDescription: z
    .string()
    .describe('Una descripción general de la audiencia objetivo actual o deseada.'),
  productServiceDescription: z
    .string()
    .describe('Descripción del producto o servicio que se ofrece.'),
  marketingGoals: z
    .string()
    .describe('Los objetivos de marketing que la empresa busca alcanzar (ej. aumentar ventas, reconocimiento de marca).'),
});
export type IdealCustomerProfileInput = z.infer<
  typeof IdealCustomerProfileInputSchema
>;

const IdealCustomerProfileOutputSchema = z.object({
  personaName: z
    .string()
    .describe("Un nombre para el buyer persona (ej., 'Marketing Manager María')."),
  demographics: z.object({
    ageRange: z.string().describe('Rango de edad del cliente ideal (ej. 25-45 años).'),
    gender: z.string().describe('Género predominante (ej. Femenino, Masculino, Indistinto).'),
    incomeRange: z.string().describe('Rango de ingresos anuales (ej. $30,000 - $60,000).'),
    education: z.string().describe('Nivel educativo (ej. Universitario completo, Posgrado).'),
    occupation: z.string().describe('Ocupación o sector profesional (ej. Profesionales jóvenes, Emprendedores).'),
    location: z.string().describe('Ubicación geográfica (ej. Grandes ciudades, Zonas rurales de España).'),
  }).describe('Información demográfica detallada del cliente ideal.'),
  psychographics: z.object({
    interests: z.array(z.string()).describe('Intereses y pasatiempos (ej. tecnología, bienestar, viajes).'),
    lifestyle: z.string().describe('Estilo de vida (ej. Activo, hogareño, consciente de la salud).'),
    values: z.array(z.string()).describe('Valores y creencias importantes (ej. sostenibilidad, innovación, familia).'),
    personalityTraits: z.array(z.string()).describe('Rasgos de personalidad (ej. ambicioso, creativo, práctico).'),
  }).describe('Información psicográfica del cliente ideal.'),
  painPoints: z
    .array(z.string())
    .describe('Problemas o frustraciones comunes que experimenta el cliente ideal.'),
  goals: z
    .array(z.string())
    .describe('Objetivos y aspiraciones que tiene el cliente ideal.'),
  needs: z
    .array(z.string())
    .describe('Las necesidades y deseos principales que el producto/servicio satisface.'),
  objections: z
    .array(z.string())
    .describe('Objeciones o preocupaciones comunes que podría tener el cliente antes de comprar.'),
  buyingBehavior: z
    .string()
    .describe('Comportamiento de compra típico (ej. busca ofertas, valora la calidad sobre el precio, investiga antes de comprar).'),
  preferredChannels: z
    .array(z.string())
    .describe('Canales de comunicación y marketing preferidos (ej. redes sociales, email, blogs).'),
  quote: z
    .string()
    .describe('Una cita representativa que podría decir el cliente ideal, resumiendo sus necesidades o motivaciones.'),
}).describe('Un perfil detallado del cliente ideal (ICP).');
export type IdealCustomerProfileOutput = z.infer<
  typeof IdealCustomerProfileOutputSchema
>;

export async function generateIdealCustomerProfile(
  input: IdealCustomerProfileInput
): Promise<IdealCustomerProfileOutput> {
  return idealCustomerProfileFlow(input);
}

const idealCustomerProfilePrompt = ai.definePrompt({
  name: 'idealCustomerProfilePrompt',
  input: {schema: IdealCustomerProfileInputSchema},
  output: {schema: IdealCustomerProfileOutputSchema},
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `Eres un experto en marketing y un especialista en la creación de perfiles de cliente ideal (ICP).

Tu tarea es generar un perfil detallado del cliente ideal basado en la información proporcionada sobre el negocio, el público objetivo, los productos/servicios y los objetivos de marketing.

El perfil debe ser exhaustivo y útil para desarrollar estrategias de marketing efectivas, centrándose en:
- Un nombre de persona
- Demografía
- Psicografía
- Puntos de dolor
- Objetivos
- Necesidades
- Objeciones comunes
- Comportamiento de compra
- Canales preferidos
- Una cita representativa

Utiliza un tono profesional y analítico. Asegúrate de que la salida esté en español.

Descripción del Negocio: {{{businessDescription}}}
Descripción de la Audiencia Objetivo: {{{targetAudienceDescription}}}
Descripción del Producto/Servicio: {{{productServiceDescription}}}
Objetivos de Marketing: {{{marketingGoals}}}`,
});

const idealCustomerProfileFlow = ai.defineFlow(
  {
    name: 'idealCustomerProfileFlow',
    inputSchema: IdealCustomerProfileInputSchema,
    outputSchema: IdealCustomerProfileOutputSchema,
  },
  async (input) => {
    const {output} = await idealCustomerProfilePrompt(input);
    if (!output) {
        throw new Error("Failed to generate ideal customer profile.");
    }
    return output;
  }
);
