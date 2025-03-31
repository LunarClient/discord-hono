import { Command, Option, register } from "@lunarclient/discord-hono";

const commands = [new Command("ping", "Ping")];

register(
  commands,
  process.env.DISCORD_APPLICATION_ID,
  process.env.DISCORD_TOKEN,
  "946501036649119775"
);
