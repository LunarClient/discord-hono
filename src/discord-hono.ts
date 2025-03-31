import {
  APIBaseInteraction,
  APIInteractionResponsePong,
  InteractionType,
} from "discord-api-types/v10";
import type {
  ExecutionContext,
} from "@cloudflare/workers-types";
import {
  AutocompleteContext,
  CommandContext,
  ComponentContext,
  CronContext,
  ModalContext,
} from "./context";
import type {
  DiscordEnv,
  Env,
  InteractionCommandData,
  InteractionComponentData,
  InteractionModalData,
  InteractionAutocompleteData
} from "./types";
import { RegexMap, ResponseJson } from "./utils";
import { verify } from "./verify";

type CommandHandler<E extends Env = any> = (
  c: CommandContext<E>
) => Promise<Response> | Response;
type ComponentHandler<E extends Env = any> = (
  c: ComponentContext<E>
) => Promise<Response> | Response;
type AutocompleteHandler<E extends Env = any> = (
  c: AutocompleteContext<E>
) => Promise<Response> | Response;
type ModalHandler<E extends Env = any> = (
  c: ModalContext<E>
) => Promise<Response> | Response;
type CronHandler<E extends Env = any> = (c: CronContext<E>) => Promise<unknown>;

type DiscordEnvBindings = {
  DISCORD_TOKEN?: string;
  DISCORD_PUBLIC_KEY?: string;
  DISCORD_APPLICATION_ID?: string;
};

let storedEnv: any = undefined;

abstract class DiscordHonoBase<E extends Env> {
  #verify = verify;
  #discord: (env: DiscordEnvBindings | undefined) => DiscordEnv;
  #commandMap = new RegexMap<string | RegExp, CommandHandler<E>>();
  #componentMap = new RegexMap<string | RegExp, ComponentHandler<E>>();
  #autocompleteMap = new RegexMap<string | RegExp, AutocompleteHandler<E>>();
  #modalMap = new RegexMap<string | RegExp, ModalHandler<E>>();
  #cronMap = new RegexMap<string | RegExp, CronHandler<E>>();

  constructor() {
    this.#discord = (env) => {
      return {
        APPLICATION_ID: env?.DISCORD_APPLICATION_ID,
        TOKEN: env?.DISCORD_TOKEN,
        PUBLIC_KEY: env?.DISCORD_PUBLIC_KEY,
      };
    };
  }

  /**
   * Register a command handler
   * @param command Command name or regex
   * @param handler The handler function
   * @returns The application instance
   */
  command = (command: string | RegExp, handler: CommandHandler<E>) => {
    this.#commandMap.set(command, handler);
    return this;
  };

  /**
   * Register a component handler
   * @param component_id Component id or regex
   * @param handler The handler function
   * @returns The application instance
   */
  component = (component_id: string | RegExp, handler: ComponentHandler<E>) => {
    this.#componentMap.set(component_id, handler);
    return this;
  };

  /**
   * Register an autocomplete handler
   * @param command Autocomplete command name or regex
   * @param handler The handler function
   * @returns The application instance
   */
  autocomplete = (command: string | RegExp, handler: AutocompleteHandler<E>) => {
    this.#autocompleteMap.set(command, handler);
    return this;
  };

  /**
   * Register a modal handler
   * @param modal_id Modal custom id or regex
   * @param handler The handler function
   * @returns The application instance
   */
  modal = (modal_id: string | RegExp, handler: ModalHandler<E>) => {
    this.#modalMap.set(modal_id, handler);
    return this;
  };

  /**
   * Register a cron handler, this should also be registered in wrangler.toml
   * @param cron Cron expression
   * @param handler The handler function
   * @returns The application instance
   */
  cron = (cron: string | RegExp, handler: CronHandler<E>) => {
    this.#cronMap.set(cron, handler);
    return this;
  };

  /**
   * Extend the current app with another app
   * @param app 
   * @returns The application instance
   */
  extend = <T extends Env>(app: DiscordHonoBase<T>) => {
    const typedApp = app as unknown as this;

    for (const e of typedApp.#commandMap) this.#commandMap.set(...e);
    for (const e of typedApp.#componentMap) this.#componentMap.set(...e);
    for (const e of typedApp.#autocompleteMap) this.#autocompleteMap.set(...e);
    for (const e of typedApp.#modalMap) this.#modalMap.set(...e);
    for (const e of typedApp.#cronMap) this.#cronMap.set(...e);

    return this;
  };

  fetch = async (request: Request, env: E["Bindings"], ctx?: ExecutionContext) => {
    storedEnv = env;

    if (request.method === "GET") {
      return new Response("powered by Discord Hono🔥");
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const discord = this.#discord(env);
    if (!discord.PUBLIC_KEY) {
      throw new Error("PUBLIC_KEY is not set");
    }

    const body = await request.text();
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    const isValid = await this.#verify(
      body,
      signature,
      timestamp,
      discord.PUBLIC_KEY
    );

    if (!isValid) {
      return new Response("Bad request signature.", { status: 401 });
    }

    const data: APIBaseInteraction<InteractionType, any> = JSON.parse(body);
    switch (data.type) {
      case InteractionType.Ping: {
        return new ResponseJson({ type: 1 } as APIInteractionResponsePong);
      }
      case InteractionType.ApplicationCommand: {
        const { handler, interaction, key } = getHandler(
          this.#commandMap,
          data as InteractionCommandData
        );

        return await handler(
          new CommandContext(request, env, ctx, discord, interaction, key)
        );
      }
      case InteractionType.MessageComponent: {
        const { handler, interaction, key } = getHandler(
          this.#componentMap,
          data as InteractionComponentData
        );

        return await handler(
          new ComponentContext(request, env, ctx, discord, interaction, key)
        );
      }
      case InteractionType.ApplicationCommandAutocomplete: {
        const { handler, interaction, key } = getHandler(
          this.#autocompleteMap,
          data as InteractionAutocompleteData
        );
        return await handler(
          new AutocompleteContext(
            request,
            env,
            ctx,
            discord,
            interaction,
            key
          )
        );
      }
      case InteractionType.ModalSubmit: {
        const { handler, interaction, key } = getHandler(
          this.#modalMap,
          data as InteractionModalData
        );
        return await handler(
          new ModalContext(request, env, ctx, discord, interaction, key)
        );
      }
    }

    return new Response("Unknown Interaction Type", { status: 400 });
  }

  scheduled = async (event: ScheduledEvent, env: E["Bindings"], ctx?: ExecutionContext) => {
    storedEnv = env;

    const discord = this.#discord(env);
    const handler = this.#cronMap.get(event.cron);

    if (!handler) {
      throw new Error(`Cron handler not found for ${event.cron}`);
    }

    const c = new CronContext(event, env, ctx, discord, event.cron);
    if (ctx?.waitUntil) ctx.waitUntil(handler(c));
    else {
      console.log("The process does not apply waitUntil");
      await handler(c);
    }
  };
}

/**
 * Get the bindings for use outside of handlers
 * @returns Context object with bindings and Discord environment
 */
export const getBindings = <E extends Env>() => {
  const typedStoredEnv = storedEnv as E | undefined
  if (!typedStoredEnv) {
    throw new Error('getBindings() called before any handler received environment bindings');
  }

  return typedStoredEnv;
};

const getHandler = <
  H extends CommandHandler | ComponentHandler | AutocompleteHandler | ModalHandler,
  C extends InteractionCommandData | InteractionComponentData | InteractionModalData | InteractionAutocompleteData
>(
  map: RegexMap<string | RegExp, H>,
  interaction: C
): { handler: H; interaction: C; key: string } => {
  if (!interaction.data) {
    throw new Error("Interaction data is missing");
  }

  let key = null;
  switch (interaction.type) {
    case InteractionType.ApplicationCommand:
      key = interaction.data.name;
      break;
    case InteractionType.MessageComponent:
      key = interaction.data.custom_id;
      break;
    case InteractionType.ApplicationCommandAutocomplete:
      key = interaction.data.name;
      break;
    case InteractionType.ModalSubmit:
      key = interaction.data.custom_id;
      break;
    default:
      throw new Error("Unknown interaction type");
  }

  const handler = map.get(key);
  if (!handler) {
    throw new Error(`Handler not found for ${key}`);
  }

  return {
    handler,
    interaction,
    key,
  }
};

export class DiscordHono<E extends Env = Env> extends DiscordHonoBase<E> { }
