import { Events, EmbedBuilder } from "discord.js";
import { Member } from "../utils.js";
import config from "../config.json" assert { type: "json" };

export default {
    name: Events.MessageReactionAdd,
    once: false,
    async execute(reaction, user) {
        if (
            reaction._emoji.name !== "🗑️" ||
            reaction.message.channelId !== config.successChannel ||
            user.bot ||
            !reaction.message.reference ||
            reaction.message.reference.guildId !== config.guildId
        )
            return;
        try {
            const post = await (
                await reaction.client.channels.fetch(reaction.message.reference.channelId)
            ).messages.fetch(reaction.message.reference.messageId);
            if (user.id !== "451948906092298241" || user.id !== post.author.id) return;
            await post.delete();
            await reaction.message.delete();
            await Member.findOneAndUpdate({ id: post.author.id }, { $inc: { successPoints: -1 } });
        } catch (err) {
            if (err.code !== 10008) console.error(err);
            return;
        }
    },
};
