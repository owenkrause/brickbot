import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("alias")
        .setDescription("Alias/Goat market data")
        .addStringOption((option) => option.setName("product").setDescription("product").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()

        const proxy = getProxy()

        let query, normal, consigned
        try {
            const headers = {
                "X-Algolia-Application-Id": "2FWOTDVM2O",
                "X-Algolia-API-Key": "838ecd564b6aedc176ff73b67087ff43",
                "user-agent": "alias/1.23.1 (com.goat.OneSell.ios build:850 iOS 16.0.0) Alamofire/5.6.2",
            }
            query = await instance.get(
                `https://2fwotdvm2o-dsn.algolia.net/1/indexes/product_variants_v2?query=${interaction.options.getString("product")}`,
                { headers: headers, proxy: false, httpsAgent: proxy }
            )
            if (!query.data.hits.length) throw new Error("Product not found")
            normal = await instance.post(
                `https://sell-api.goat.com/api/v1/analytics/list-variant-availabilities`, {
                    variant: {
                        id: query.data.hits[0].slug,
                        packagingCondition: "PACKAGING_CONDITION_GOOD_CONDITION",
                        product_condition: "PRODUCT_CONDITION_NEW",
                        regionId: "3",
                        consigned: false,
                    },
                },
                { proxy: false, httpsAgent: proxy }
            )
            consigned = await instance.post(
                `https://sell-api.goat.com/api/v1/analytics/list-variant-availabilities`, {
                    variant: {
                        id: query.data.hits[0].slug,
                        packagingCondition: "PACKAGING_CONDITION_GOOD_CONDITION",
                        product_condition: "PRODUCT_CONDITION_NEW",
                        regionId: "3",
                        consigned: true,
                    },
                },
                { proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply("Error fetching data")
        }
        const embedFormat = []
        for (let i = 0, n = normal.data.availability.length; i < n; i++) {
            const consignedVariant = consigned.data.availability.find(
                (x) => x.variant.size === normal.data.availability[i].variant.size
            )
            if (!consignedVariant) continue
            if (!normal.data.availability[i].lowest_price_cents && !consignedVariant.lowest_price_cents) continue
            embedFormat.push(`${normal.data.availability[i].variant.size}- $${normal.data.availability[i].lowest_price_cents ? normal.data.availability[i].lowest_price_cents / 100 : ""}${consignedVariant.lowest_price_cents ? ` | $${consignedVariant.lowest_price_cents / 100}` : ""}\n`)
        }
        const embed = new EmbedBuilder()
            .setTitle(query.data.hits[0].name)
            .setURL(`https://www.goat.com/sneakers/${query.data.hits[0].slug}`)
            .setThumbnail(query.data.hits[0].main_picture_url)
            .setDescription(`SKU: ${query.data.hits[0].sku}`)

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
