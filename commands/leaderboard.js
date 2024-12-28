import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Member } from "../utils.js"

export default {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("Success Leaderboard"),

    async execute(interaction) {
        const members = (await Member.find()).sort((a, b) => b.successPoints - a.successPoints)
        let points = []
        let names = []
        for (let i = 0; i < 10; i++) {
            names[i] = `<@${members[i].id}>`
            points[i] = members[i].successPoints
        }

        const embed = new EmbedBuilder()
            .setTitle("Success Leaderboard")
            .addFields(
                { name: "Top 10", value: names.join("\n"), inline: true },
                { name: "Points", value: points.join("\n"), inline: true }
            )

        await interaction.reply({ embeds: [embed] })
    },
}
