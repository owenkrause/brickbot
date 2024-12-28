import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("nike")
        .setDescription("Nike online stock checker")
        .addStringOption((option) => option.setName("sku").setDescription("sku").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()
        let response
        try {
            response = await instance.get(
                `https://api.nike.com/product_feed/threads/v2?filter=language(en)&filter=marketplace(US)&filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)&filter=productInfo.merchProduct.styleColor(${interaction.options.getString("sku").toUpperCase()})`,
                { proxy: false, httpsAgent: getProxy() }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply("Error fetching stock")
        }
        if (response.data.objects.length === 0) {
            const embed = new EmbedBuilder().setDescription(`${interaction.options.getString("sku").toUpperCase()} not loaded on nike`)
            await interaction.editReply({ embeds: [embed] })
            return
        }
        if (!response.data.objects[0].productInfo[0].skus) {
            const embed = new EmbedBuilder().setDescription(`${interaction.options.getString("sku").toUpperCase()} loaded on nike, but no stock information found`)
            await interaction.editReply({ embeds: [embed] })
            return
        }
        const data = response.data.objects[0].productInfo[0]

        const embed = new EmbedBuilder()
            .setTitle(data.productContent.title)
            .setURL(`https://www.nike.com/us/t/-/${data.merchProduct.styleColor}`)
            .setThumbnail(data.imageUrls.productImageUrl)
            .addFields(
                { name: "Status", value: data.merchProduct.status, inline: true },
                { name: "SKU", value: data.merchProduct.styleColor, inline: true },
                { name: "Price", value: data.merchPrice.currentPrice.toString(), inline: true }
            )

        const embedFormat = []
        for (let i = 0; i < data.skus.length; i++) {
            if (data.availableSkus[i].level !== "OOS") {
                embedFormat.push(`${data.skus[i].nikeSize} - ${data.availableSkus[i].level}\n`)
            }
        }
        if (!embedFormat.length) {
            embed.addFields({ name: "Stock Levels", value: "All sizes OOS" })
        } else if (embedFormat.length < 8) {
            embed.addFields({ name: "Stock Levels", value: embedFormat.join("") })
        } else {
            const first = embedFormat.slice(0, Math.round(embedFormat.length / 2)).join("")
            const second = embedFormat.slice(Math.round(embedFormat.length / 2), embedFormat.length).join("")
            embed.addFields(
                { name: "Stock Levels", value: first, inline: true },
                { name: "\u200b", value: second, inline: true }
            )
        }
        await interaction.editReply({ embeds: [embed] })
    },
}
