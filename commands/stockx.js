import axios from "axios"
import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("stockx")
        .setDescription("StockX market data")
        .addStringOption((option) => option.setName("product").setDescription("product").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()

        const proxy = getProxy()
        const headers = {
            "x-px-authorization": "4",
            "accept": "*/*",
            "x-px-bypass-reason":"The%20certificate%20for%20this%20server%20is%20invalid.%20You%20might%20be%20connecting%20to%20a%20server%20that%20is%20pretending%20to%20be%20%E2%80%9Cpx-conf.perimeterx.net%E2%80%9D%20which%20could%20put%20your%20confidential%20information%20at%20risk.",
            "app-version": "5.0.0.29506",
            "app-platform": "ios",
            "app-name": "StockX-iOS",
            "accept-language": "en-US",
            "x-api-key": "99WtRZK6pS1Fqt8hXBfWq8BYQjErmwipa3a0hYxX",
            "accept-encoding": "gzip, deflate, br",
            "user-agent": "StockX/29506 CFNetwork/1335.0.3.4 Darwin/21.6.0",
        }
        let response
        try {
            response = await axios.get(
                `https://gateway.stockx.com/api/v3/browse?_search=${encodeURIComponent(interaction.options.getString("product"))}&dataType=product&order=DESC&sort=featured&currency=USD&country=US`,
                { headers: headers, proxy: false, httpsAgent: proxy }
            )
            const uuid = response.data.Products[0].uuid
            response = await axios.get(
                `https://gateway.stockx.com/api/v2/products/${uuid}?includes=market&currency=USD&country=US`,
                { headers: headers, proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply("Error fetching market data", { ephemeral: true })
        }
        const embedFormat = []
        for (const [uuid, variant] of Object.entries(response.data.Product.children)) {
            embedFormat.push(`${variant.shoeSize}- ${variant.market.lowestAsk == 0 ? "none" : `$${variant.market.lowestAsk}`}\n`)
        }
        const embed = new EmbedBuilder()
            .setTitle(response.data.Product.title)
            .setURL(`https://www.stockx.com/${response.data.Product.urlKey}`)
            .setThumbnail(response.data.Product.media.thumbUrl)
            .setDescription(`SKU: ${response.data.Product.styleId} | Colorway: ${response.data.Product.colorway} | Retail: ${response.data.Product.retailPrice} | Release Date: ${response.data.Product.releaseDate} | 72hr Sales: ${response.data.Product.market.salesLast72Hours}`)

        if (embedFormat.length < 8)
            embed.addFields({name: "Market Data",value: embedFormat.join(""),})
        else {
            const first = embedFormat.slice(0, Math.round(embedFormat.length / 2)).join("")
            const second = embedFormat.slice(Math.round(embedFormat.length / 2), embedFormat.length).join("")
            embed.addFields(
                { name: "Market Data", value: first, inline: true },
                { name: "\u200b", value: second, inline: true }
            )
        }
        await interaction.editReply({ embeds: [embed] })
    },
}
