
🔥 This project is heavily influenced by [Hono](https://github.com/honojs/hono).  
Thank you for [Yusuke Wada](https://github.com/yusukebe) and Hono contributors! [Hono LICENSE](https://github.com/honojs/hono/blob/main/LICENSE)

## 🚀 Getting Started

[<img alt="Node.js" src="https://img.shields.io/badge/Node.js-20.x-%23339933?logo=Node.js" />](https://nodejs.org)

### Install

```shell
npm i discord-hono
```

## Sample Code

[Repository](https://github.com/LuisFun/sample-discord-hono)

### index.ts

```js
import type { ScheduledHandler } from "discord-hono"
import { DiscordHono } from "discord-hono"
import { commands } from "./commands"

type Bindings = {
	db: D1Database
}
export type Env = { Bindings: Bindings }

const scheduled: ScheduledHandler<Env> = async c => {
	console.log("Run Scheduled")
}

const app = new DiscordHono<Env>()
app.setCommands(commands)
app.setScheduled("", scheduled)
export default app
```

### commands.ts

```js
import type { Env } from "."
import type { Commands, Context } from "discord-hono"

export const commands: Commands<Env> = [
  [
    {
      name: "ping",
      description: "response Pong",
    },
    async c => {
      //const db = c.env.db
      return c.resText("Pong")
    },
  ],
  [
    {
      name: "img",
      description: "response Image",
      options: [{
        type: 3,
        name: "content",
        description: "response text",
      }],
    },
    async c => {
      c.executionCtx.waitUntil(handler(c))
      return c.resDefer()
    }
  ],
]

const handler = async (c: Context<Env>) => {
  try {
    //const db = c.env.db
    const imageResponse = await fetch("https://luis.fun/luisfun.png")
    const arrayBuffer = await imageResponse.arrayBuffer()
    const blob = new Blob([arrayBuffer])
    await c.send({
      content: c.command.options["content"],
      files: [blob],
    })
  } catch {
    await c.sendText("error")
  }
}

```

### register.ts

```js
import dotenv from "dotenv"
import process from "node:process"
import type { RegisterArg } from "discord-hono"
import { register } from "discord-hono"
import { commands } from "./commands"

dotenv.config({ path: ".dev.vars" })

const arg: RegisterArg = {
  commands: commands,
  applicationId: process.env.DISCORD_APPLICATION_ID,
  token: process.env.DISCORD_TOKEN,
  //guildId: process.env.DISCORD_TEST_GUILD_ID,
}

await register(arg)
```
