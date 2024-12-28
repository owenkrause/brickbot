import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("fc")
        .setDescription("Fightclub market data")
        .addStringOption((option) => option.setName("product").setDescription("product").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()

        const proxy = getProxy()
        let query, prod
        try {
            query = await instance.get(
                `https://sell.flightclub.com/api/public/search?page=1&perPage=1&query=${interaction.options.getString("product")}`,
                { proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply("Error searching for item")
        }
        if (!query.data.results.length) {
            return await interaction.editReply("Product not found")
        }
        try {
            prod = await instance.get(
                `https://sell.flightclub.com/api/public/products/${query.data.results[0].id}`, 
                { proxy: false,httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply("Error fetching product")
        }

        const embed = new EmbedBuilder()
            .setTitle(prod.data.model)
            .setURL(`https://sell.flightclub.com/products/${prod.data.id}`)
            .setThumbnail(prod.data.imageUrl)
            .addFields(
                { name: "Sku", value: prod.data.style, inline: true },
                { name: "Retail", value: prod.data.defaultPriceFormatted, inline: true },
                { name: "\u200b", value: "\u200b", inline: true }
            )

        const embedFormat = []
        Object.keys(prod.data.suggestedPrices)
            .sort((a, b) => a - b)
            .forEach((size) => {
                if (!prod.data.suggestedPrices[size].lowestConsignedPriceCents) return
                embedFormat.push(`${size}- $${prod.data.suggestedPrices[size].lowestConsignedPriceCents / 100}\n`)
            })
        if (!embedFormat.length) embed.addFields({ name: "Lowest Asks", value: "No data" })
        else if (embedFormat.length < 8) embed.addFields({ name: "Lowest Asks", value: embedFormat.join("") })
        else {
            const first = embedFormat.slice(0, Math.round(embedFormat.length / 2)).join("")
            const second = embedFormat.slice(Math.round(embedFormat.length / 2), embedFormat.length).join("")
            embed.addFields(
                { name: "Lowest Asks", value: first, inline: true },
                { name: "\u200b", value: second, inline: true }
            )
        }
        await interaction.editReply({ embeds: [embed] })
    },
}
