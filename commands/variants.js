import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("variants")
        .setDescription("Shopify variant scraper")
        .addStringOption((option) => option.setName("url").setDescription("url").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()

        const components = interaction.options.getString("url").trim().split("?")[0].split("/")
        const baseUrl = components[0] + "//" + components[2]
        let response

        try {
            response = await instance.get(
                `${interaction.options.getString("url").trim().split("?")[0]}.json`, 
                { proxy: false, httpsAgent: getProxy() }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply("Error fetching variants")
        }
        const variantList = []
        const sizeList = []
        const sizeListNoLink = []
        const atcAll = []

        for (let i = 0, n = response.data.product.variants.length; i < n; i++) {
            variantList[i] = `${response.data.product.variants[i].id}\n`
            sizeList[i] = `[${response.data.product.variants[i].title}](${baseUrl}/cart/add/${response.data.product.variants[i].id})\n`
            sizeListNoLink[i] = `${response.data.product.variants[i].title}\n`
            atcAll[i] = `${response.data.product.variants[i].id}:1,`
        }
        const embed = new EmbedBuilder()
            .setTitle(response.data.product.title)
            .setURL(interaction.options.getString("url"))
            .setDescription(`[ATC FSR](${baseUrl}/cart/${atcAll.join("")})`)
            .setFooter({ text: "https://site.com/add/VARIANT" })

        try {
            embed.addFields(
                { name: "Variants", value: variantList.join(""), inline: true },
                { name: "Sizes", value: sizeList.join(""), inline: true }
            )
        } catch {
            embed.addFields(
                { name: "Variants", value: variantList.join(""), inline: true },
                { name: "Sizes", value: sizeListNoLink.join(""), inline: true }
            )
        }
        await interaction.editReply({ embeds: [embed] })
    },
}
