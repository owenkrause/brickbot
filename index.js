import { Client, GatewayIntentBits, Collection } from "discord.js";
import config from "./config.json" assert { type: "json" };
import fs from "fs";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});
client.commands = new Collection();
const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    client.commands.set(command.default.data.name, command.default);
}

const eventFiles = fs
    .readdirSync("./events")
    .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    if (event.default.once) {
        client.once(event.default.name, (...args) =>
            event.default.execute(...args)
        );
    } else {
        client.on(event.default.name, (...args) =>
            event.default.execute(...args)
        );
    }
}

client.login(config.token);
