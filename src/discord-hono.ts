import type {
  APIApplicationCommandAutocompleteInteraction,
  APIBaseInteraction,
  APIInteractionResponsePong,
  InteractionType,
} from "discord-api-types/v10";
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
  InitOptions,
  InteractionCommandData,
  InteractionComponentData,
  InteractionModalData,
  Verify,
} from "./types";
import { RegexMap, ResponseJson, errorDev, errorSys } from "./utils";
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

abstract class DiscordHonoBase<E extends Env> {
  #verify: Verify = verify;
  #discord: (env: DiscordEnvBindings | undefined) => DiscordEnv;
  #commandMap = new RegexMap<string | RegExp, CommandHandler<E>>();
  #componentMap = new RegexMap<string | RegExp, ComponentHandler<E>>();
  #autocompleteMap = new RegexMap<string | RegExp, AutocompleteHandler<E>>();
  #modalMap = new RegexMap<string | RegExp, ModalHandler<E>>();
  #cronMap = new RegexMap<string | RegExp, CronHandler<E>>();
  /**
   * [Documentation](https://discord-hono.luis.fun/interactions/discord-hono/)
   * @param {InitOptions} options
   */
  constructor(options?: InitOptions<E>) {
    if (options?.verify) this.#verify = options.verify;
    this.#discord = (env) => {
      const discordEnv = options?.discordEnv ? options.discordEnv(env) : {};
      return {
        APPLICATION_ID: env?.DISCORD_APPLICATION_ID,
        TOKEN: env?.DISCORD_TOKEN,
        PUBLIC_KEY: env?.DISCORD_PUBLIC_KEY,
        ...discordEnv,
      };
    };
  }

  /**
   * @param {string | RegExp} command Match the first argument of `Command`
   * @param handler
   * @returns {this}
   */
  command = (command: string | RegExp, handler: CommandHandler<E>) => {
    this.#commandMap.set(command, handler);
    return this;
  };
  /**
   * @param {string | RegExp} component_id Match the first argument of `Button` or `Select`
   * @param handler
   * @returns {this}
   */
  component = (component_id: string | RegExp, handler: ComponentHandler<E>) => {
    this.#componentMap.set(component_id, handler);
    return this;
  };
  /**
   * @param {string | RegExp} command Match the first argument of `Command`
   * @param handler
   * @returns {this}
   */
  autocomplete = (
    command: string | RegExp,
    handler: AutocompleteHandler<E>,
    commandHandler?: CommandHandler<E>
  ) => {
    this.#autocompleteMap.set(command, handler);
    if (commandHandler) this.#commandMap.set(command, commandHandler);
    return this;
  };
  /**
   * @param {string | RegExp} modal_id Match the first argument of `Modal`
   * @param handler
   * @returns {this}
   */
  modal = (modal_id: string | RegExp, handler: ModalHandler<E>) => {
    this.#modalMap.set(modal_id, handler);
    return this;
  };

  /**
   * @param cron Match the crons in the toml file
   * @param handler
   */
  cron = (cron: string | RegExp, handler: CronHandler<E>) => {
    this.#cronMap.set(cron, handler);
    return this;
  };

  /**
   * Extends the current instance with another instance
   * @param
   * @returns
   */
  extend = (app: this) => {
    for (const e of app.#commandMap) this.#commandMap.set(...e);
    for (const e of app.#componentMap) this.#componentMap.set(...e);
    for (const e of app.#autocompleteMap) this.#autocompleteMap.set(...e);
    for (const e of app.#modalMap) this.#modalMap.set(...e);
    for (const e of app.#cronMap) this.#cronMap.set(...e);

    return this;
  };

  /**
   * @param {Request} request
   * @param {Record<string, unknown>} env
   * @param executionCtx
   * @returns {Promise<Response>}
   */
  fetch = async (
    request: Request,
    env?: E["Bindings"],
    ctx?: ExecutionContext
  ) => {
    switch (request.method) {
      case "GET":
        return new Response("powered by Discord Hono🔥");
      case "POST": {
        const discord = this.#discord(env);
        if (!discord.PUBLIC_KEY) throw errorDev("DISCORD_PUBLIC_KEY");
        // verify
        const body = await request.text();
        const signature = request.headers.get("x-signature-ed25519");
        const timestamp = request.headers.get("x-signature-timestamp");
        const isValid = await this.#verify(
          body,
          signature,
          timestamp,
          discord.PUBLIC_KEY
        );
        if (!isValid)
          return new Response("Bad request signature.", { status: 401 });
        // verify end
        // ************ any 何とかしたい
        const data: APIBaseInteraction<InteractionType, any> = JSON.parse(body);
        switch (data.type) {
          case 1: {
            return new ResponseJson({ type: 1 } as APIInteractionResponsePong);
          }
          case 2: {
            const interaction = data as InteractionCommandData;
            const { handler, key } = getHandler<CommandHandler<E>>(
              this.#commandMap,
              interaction.data?.name.toLowerCase()
            );
            return await handler(
              new CommandContext(request, env, ctx, discord, interaction, key)
            );
          }
          case 3: {
            const { handler, interaction, key } = getHandler<
              ComponentHandler<E>
            >(this.#componentMap, data as InteractionComponentData);
            return await handler(
              new ComponentContext(request, env, ctx, discord, interaction, key)
            );
          }
          case 4: {
            const interaction =
              data as APIApplicationCommandAutocompleteInteraction;
            const { handler, key } = getHandler<AutocompleteHandler<E>>(
              this.#autocompleteMap,
              interaction.data?.name.toLowerCase()
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
          case 5: {
            const { handler, interaction, key } = getHandler<ModalHandler<E>>(
              this.#modalMap,
              data as InteractionModalData
            );
            return await handler(
              new ModalContext(request, env, ctx, discord, interaction, key)
            );
          }
          default: {
            console.error(
              `interaction.type: ${data.type}\nNot yet implemented`
            );
            return new ResponseJson({ error: "Unknown Type" }, { status: 400 });
          }
        }
      }
      default:
        return new Response("Not Found.", { status: 404 });
    }
  };

  /**
   * Methods triggered by cloudflare workers' crons
   * @param event
   * @param {Record<string, unknown>} env
   * @param executionCtx
   */
  scheduled = async (
    event: ScheduledEvent,
    env: E["Bindings"],
    executionCtx?: ExecutionContext
  ) => {
    const discord = this.#discord(env);
    const { handler, key } = getHandler<CronHandler<E>>(
      this.#cronMap,
      event.cron
    );
    const c = new CronContext(event, env, executionCtx, discord, key);
    if (executionCtx?.waitUntil) executionCtx.waitUntil(handler(c));
    else {
      console.log("The process does not apply waitUntil");
      await handler(c);
    }
  };
}

const getHandler = <
  H extends
    | CommandHandler
    | ComponentHandler
    | ModalHandler
    | AutocompleteHandler
    | CronHandler,
  I extends
    | string
    | undefined
    | InteractionComponentData
    | InteractionModalData = any
>(
  map: RegexMap<string | RegExp, H>,
  interaction: I
) => {
  let key = "";
  if (typeof interaction === "string") key = interaction;
  else {
    if (!interaction?.data) throw errorSys("interaction.data");
    const id = interaction.data.custom_id;
    key = id.split(";")[0];
    interaction.data.custom_id = id.slice(key.length + 1);
  }
  const handler = map.match(key) || map.get("");
  if (!handler) throw errorDev("Handler");
  return { handler, interaction, key };
};

export class DiscordHono<E extends Env = Env> extends DiscordHonoBase<E> {}
