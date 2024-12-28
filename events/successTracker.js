import { Events, EmbedBuilder } from "discord.js";
import { Member } from "../utils.js";
import config from "../config.json" assert { type: "json" };

export default {
    name: Events.MessageCreate,
    once: false,
    async execute(message) {
        if (message.author.bot) return;
        if (message.channelId === config.successChannel && message.attachments.size) {
            await Member.findOneAndUpdate({ id: message.author.id }, { $inc: { successPoints: 1 } });
            const embed = new EmbedBuilder().setTitle("Success Tracker").setDescription("You have gained 1 point");
            await (await message.reply({ embeds: [embed] })).react("🗑️");
        }
    },
};
