'use server';
/**
 * @fileOverview A Genkit flow for generating various types of creative marketing content.
 *
 * - generateCreativeContent - A function that handles the creative content generation process.
 * - CreativeContentInput - The input type for the generateCreativeContent function.
 * - CreativeContentOutput - The return type for the generateCreativeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const CreativeContentInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  companyDescription: z.string().describe('A detailed description of the company, its mission, and values, or specific inputs for the creative task.'),
  targetAudience: z.string().describe('A description of the target audience.'),
  creativeType: z.enum(['slogan', 'newsletter', 'brochure']).describe("The type of creative content to generate."),
});
export type CreativeContentInput = z.infer<typeof CreativeContentInputSchema>;

const CreativeContentOutputSchema = z.object({
  generatedContent: z.string().describe('The AI-generated creative content, formatted in Markdown.'),
});
export type CreativeContentOutput = z.infer<typeof CreativeContentOutputSchema>;

export async function generateCreativeContent(input: CreativeContentInput): Promise<CreativeContentOutput> {
  return generateCreativeContentFlow(input);
}

const getPrompt = (type: CreativeContentInput['creativeType'], companyName: string, companyDescription: string, targetAudience: string) => {
  switch (type) {
    case 'slogan':
      return `Eres un experto en branding y redactor publicitario. Tu tarea es generar 5 eslóganes creativos, pegadizos y memorables para la empresa '${companyName}'.
      
      Información clave:
      - Descripción del producto/servicio: ${companyDescription}
      - Público Objetivo: ${targetAudience}
      
      Devuelve los 5 eslóganes en una lista de Markdown.`;
    case 'newsletter':
      return `Eres un experto en email marketing. Tu tarea es redactar una estructura completa para un correo de newsletter para la empresa '${companyName}'. El correo debe ser persuasivo y estar diseñado para captar la atención y generar una acción.

      Información clave:
      - Tema del Boletín: ${companyDescription}
      - Audiencia Objetivo: ${targetAudience}
      
      Basándote en esta información, genera el siguiente contenido en formato Markdown:
      - **Asunto:** Un asunto de correo electrónico llamativo y que genere curiosidad.
      - **Gancho:** Un párrafo inicial (2-3 frases) que capte la atención del lector inmediatamente.
      - **Desarrollo de Valor:** 2 o 3 párrafos cortos donde expliques el valor principal del tema del boletín. Aporta datos, beneficios o consejos útiles.
      - **Llamada a la Acción (CTA):** Un párrafo final claro y conciso que incite al lector a realizar una acción específica (ej. visitar un enlace, responder al correo, etc.). Incluye el texto del botón o enlace sugerido.`;
    case 'brochure':
      return `Eres un diseñador de marketing y comunicador visual. Tu tarea es proponer una estructura y contenido para un folleto (brochure) de tres pliegues para la empresa '${companyName}'. El objetivo es presentar la información de forma clara, atractiva y persuasiva.

      Información clave para el folleto:
      - Contenido Principal (Propuesta de valor, puntos clave, etc.): ${companyDescription}
      - Público Objetivo: ${targetAudience}
      
      Organiza el contenido en las siguientes secciones, proporcionando un texto sugerido para cada una en formato Markdown:
      - **Portada:** Debe incluir el nombre de la empresa, un eslogan potente y una descripción de una imagen sugerente (ej. "[Imagen de...])".
      - **Panel Interior (Problema/Necesidad):** Describe el problema o la necesidad que tiene el cliente y que tu producto/servicio resuelve.
      - **Panel Interior (Solución):** Presenta tu producto o servicio como la solución ideal a ese problema. Describe cómo funciona.
      - **Panel Interior (Beneficios y Testimonios):** Destaca 3-4 beneficios clave. Incluye un testimonio ficticio pero realista.
      - **Contraportada (Contacto y CTA):** Incluye toda la información de contacto (dirección, teléfono, email, web, redes sociales) y una clara llamada a la acción (CTA).`;
  }
};


const generateCreativeContentFlow = ai.defineFlow(
  {
    name: 'generateCreativeContentFlow',
    inputSchema: CreativeContentInputSchema,
    outputSchema: CreativeContentOutputSchema,
  },
  async (input) => {
    const promptText = getPrompt(input.creativeType, input.companyName, input.companyDescription, input.targetAudience);

    const llmResponse = await ai.generate({
        prompt: promptText,
        model: googleAI.model('gemini-1.5-flash-latest'),
    });
    
    if (!llmResponse.text) {
      throw new Error('Failed to generate creative content from LLM.');
    }
    
    return { generatedContent: llmResponse.text };
  }
);
