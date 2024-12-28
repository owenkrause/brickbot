import { Events } from "discord.js";
import { Member } from "../utils.js";

export default {
    name: Events.GuildMemberRemove,
    once: false,
    async execute(member) {
        if (!member.user.bot) {
            await Member.findOneAndDelete({ id: member.user.id });
        }
    },
};
