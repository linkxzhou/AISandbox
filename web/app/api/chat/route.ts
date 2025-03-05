import { Duration } from '@/lib/duration'
import { getModelClient, getDefaultMode } from '@/lib/models'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { toPrompt } from '@/lib/prompt'
import ratelimit from '@/lib/ratelimit'
import { fragmentSchema as schema } from '@/lib/schema'
import { Templates } from '@/lib/templates'
import { streamObject, LanguageModel, CoreMessage, generateObject } from 'ai'

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW
  ? (process.env.RATE_LIMIT_WINDOW as Duration)
  : '1d'

export async function POST(req: Request) {
  const {
    messages,
    userID,
    template,
    model,
    config,
  }: {
    messages: CoreMessage[]
    userID: string
    template: Templates
    model: LLMModel
    config: LLMModelConfig
  } = await req.json()

  const limit = !config.apiKey
    ? await ratelimit(
        userID,
        rateLimitMaxRequests,
        ratelimitWindow,
      )
    : false

  if (limit) {
    return new Response('You have reached your request limit for the day.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.amount.toString(),
        'X-RateLimit-Remaining': limit.remaining.toString(),
        'X-RateLimit-Reset': limit.reset.toString(),
      },
    })
  }

  console.log('userID', userID)
  console.log('template', template)

  const { model: modelNameString, apiKey: modelApiKey, ...modelParams } = config
  const modelClient = getModelClient(model, config)

  const isStream = false // TODO：如果接口支持stream，设置为true
  const generateResponse = async (isStream: boolean) => {
    const commonConfig: any = {
      model: modelClient as LanguageModel,
      schema,
      system: toPrompt(template),
      messages,
      mode: getDefaultMode(model),
      ...modelParams,
    }

    console.log('request config', commonConfig)

    if (isStream) {
      const stream = await streamObject(commonConfig)
      return stream.toTextStreamResponse()
    }

    const response = await generateObject(commonConfig)
    return response.toJsonResponse()
  }

  return generateResponse(false)
}
