import { instance } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "../config.json" assert { type: "json" }

export default {
    data: new SlashCommandBuilder()
        .setName("affiliate")
        .setDescription("Affiliate link creator")
        .addStringOption((option) => option
            .setName("provider")
            .setDescription("affiliate provider")
            .setRequired(true)
            .addChoices({ name: "sovrn", value: "sovrn" }, { name: "howl", value: "howl" })
        )
        .addStringOption((option) => option.setName("url").setDescription("url").setRequired(true)),

    async execute(interaction) {
        const provider = interaction.options.getString("provider")
        const url = interaction.options.getString("url")

        if (provider === "sovrn") {
            await interaction.reply({
                content: `http://redirect.viglink.com?u=${encodeURIComponent(url)}&key=${config.sovrnAPIKey}`,
                ephemeral: true,
            })
        } else if (provider === "howl") {
            try {
                const res = await instance({
                    method: "post",
                    url: "https://api.planethowl.com/api/v1/smart_links/",
                    data: {
                        url: url,
                        article_name: "untitled",
                        exclusive_match_requested: true,
                    },
                    headers: {
                        Authorization: `NRTV-API-KEY ${config.howlAPIKey}`,
                        "Content-Type": "application/json",
                    },
                })
                await interaction.reply({ content: res.data.data[0].howl_link_url, ephemeral: true })
            } catch (err) {
                console.log(err)
                await interaction.reply({ content: "Error creating affiliate link", ephemeral: true })
            }
        }
    },
}
