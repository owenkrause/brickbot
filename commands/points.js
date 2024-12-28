import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Member } from "../utils.js"

export default {
    data: new SlashCommandBuilder().setName("points").setDescription("Your success points"),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("Success Points")
            .setDescription(`You have ${(await Member.findOne({ id: interaction.user.id })).successPoints} points`)
        await interaction.reply({ embeds: [embed] })
    },
}
