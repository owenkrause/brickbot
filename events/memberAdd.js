import { Events } from "discord.js";
import { Member } from "../utils.js";

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        if (!member.user.bot) {
            await new Member({ id: member.user.id, successPoints: 0 }).save();
        }
    },
};
