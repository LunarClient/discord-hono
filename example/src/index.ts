
import { Components, Button, DiscordHono, getBindings } from "@lunarclient/discord-hono";

const app = new DiscordHono();

const testFunction = () => {
	const bindings = getBindings();
	console.log(bindings);
}

app.command("ping", async (ctx) => {
	testFunction();
	return ctx.res({
		content: "Pong!",
		components: new Components().row(
			new Button("test", "Test")
		),
	});
});

app.component("test", async (ctx) => {
	return ctx.res({
		content: "Test!",
		components: new Components().row(
			new Button("test", "Test")
		),
	});
});

export default app;