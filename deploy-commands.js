import { REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };
import fs from "fs";
import path from "path";
const commands = [];

const commandsPath = path.join(path.resolve(), "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(config.token);

await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
