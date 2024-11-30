import type { EmbedBuilder } from '@discordjs/builders'
import type {
  APIApplicationCommand,
  APIApplicationCommandInteractionData,
  APIBaseInteraction,
  APIEmbed,
  APIInteractionResponseCallbackData,
  APIMessageComponentInteractionData,
  APIModalSubmission,
  ApplicationCommandType,
  InteractionType,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageJSONBody,
} from 'discord-api-types/v10'
import type { Embed } from './builder'
import type { Components } from './builder/components'

////////// Env //////////

export type Env = {
  Bindings?: Record<string, unknown>
  Variables?: Record<string, unknown>
}

////////// DiscordEnv //////////

export type DiscordEnv = {
  TOKEN?: string
  PUBLIC_KEY?: string
  APPLICATION_ID?: string
}

////////// Command //////////

/**
 * [Application Command](https://discord.com/developers/docs/interactions/application-commands)
 */
export type ApplicationCommand = Omit<
  APIApplicationCommand,
  'id' | 'type' | 'application_id' | 'default_member_permissions' | 'version'
> & {
  id?: string
  type?: ApplicationCommandType
  application_id?: string
  default_member_permissions?: string | null
  version?: string
}

////////// InitOptions //////////

export type Verify = (
  body: string,
  signature: string | null,
  timestamp: string | null,
  publicKey: string,
) => Promise<boolean> | boolean
export type InitOptions<E extends Env> = {
  verify?: Verify
  discordEnv?: (env: E['Bindings']) => DiscordEnv
}

////////// FetchEventLike //////////

export abstract class FetchEventLike {
  abstract readonly request: Request
  abstract respondWith(promise: Response | Promise<Response>): void
  abstract passThroughOnException(): void
  abstract waitUntil(promise: Promise<void>): void
}

////////// InteractionData //////////

export type InteractionCommandData = APIBaseInteraction<
  InteractionType.ApplicationCommand,
  APIApplicationCommandInteractionData
>
export type InteractionComponentData = APIBaseInteraction<
  InteractionType.MessageComponent,
  APIMessageComponentInteractionData
>
export type InteractionModalData = APIBaseInteraction<InteractionType.ModalSubmit, APIModalSubmission>

export type CustomCallbackBase =
  | APIInteractionResponseCallbackData
  | RESTPostAPIChannelMessageJSONBody
  | RESTPatchAPIChannelMessageJSONBody
export type CustomCallbackData<T extends CustomCallbackBase = APIInteractionResponseCallbackData> =
  | (Omit<T, 'components' | 'embeds'> & {
      components?: Components | T['components']
      embeds?: (Embed | EmbedBuilder | APIEmbed)[] | null
    })
  | string

////////// FileData //////////

type FileDataUnit = {
  blob: Blob
  name: string
}
export type FileData = FileDataUnit | FileDataUnit[]
