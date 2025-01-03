import type { SlashCommandBuilder } from "@discordjs/builders";
import type { Command } from "../builder/command";
import type { ApplicationCommand } from "../types";
import { apiUrl, errorDev } from "../utils";

// cloudflare-sample-app
// Copyright (c) 2022 Justin Beckwith
// https://github.com/discord/cloudflare-sample-app/blob/main/LICENSE

/**
 * [Docs](https://discord-hono.luis.fun/rest-api/register/)
 * @param {(Command | SlashCommandBuilder | ApplicationCommand)[]} commands
 * @param {string} application_id
 * @param {string} token
 * @param {string} [guild_id]
 */
export const register = async (
  commands: (Command | SlashCommandBuilder | ApplicationCommand)[],
  application_id: string | undefined,
  token: string | undefined,
  guild_id?: string | undefined
) => {
  if (!token) throw errorDev("DISCORD_TOKEN");
  if (!application_id) throw errorDev("DISCORD_APPLICATION_ID");

  const url = guild_id
    ? `${apiUrl}/applications/${application_id}/guilds/${guild_id}/commands`
    : `${apiUrl}/applications/${application_id}/commands`;
  const body = JSON.stringify(
    commands.map((cmd) => ("toJSON" in cmd ? cmd.toJSON() : cmd))
  );

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${token}`,
    },
    method: "PUT",
    body,
  });

  if (response.ok) {
    console.log("===== ✅ Success =====");
  } else {
    let errorText = `Error registering commands\n${response.url}: ${response.status} ${response.statusText}`;
    try {
      const error = await response.text();
      if (error) {
        errorText += `\n\n${error}`;
      }
    } catch (e) {
      errorText += `\n\nError reading body from request:\n${e}`;
    }
    console.error(`${errorText}\n===== ⚠️ Error =====`);
  }
};
