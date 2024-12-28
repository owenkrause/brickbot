import { instance, getProxy } from "../utils.js"
import axios from "axios"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("sg")
        .setDescription("Stadium Goods market data")
        .addStringOption((option) => option.setName("product").setDescription("product").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()

        const headers = {
            "Host": "api.stadiumgoods.com",
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Stadium%20Goods/262 CFNetwork/1390 Darwin/22.0.0",
            "Connection": "keep-alive",
            "ff-country": "US",
            "Accept-Language": "en-US",
            "x-api-key": "35d59760-8be3-467b-b419-7ca8a1a3e082",
            "Accept-Encoding": "gzip, deflate, br",
            "ff-currency": "USD",
        }

        let token, query, product
        const proxy = getProxy()
        try {
            token = await axios.post(
                `https://api.stadiumgoods.com/authentication/v1/guesttokens`,
                { guestUserId: 5000018768438675 },
                { headers: headers, proxy: false, httpsAgent: proxy }
            )
            headers.Authorization = token.data.accessToken
        } catch (err) {
            console.log(err.response)
            return await interaction.editReply("error obtaining access token")
        }
        try {
            query = await axios.get(
                `https://api.stadiumgoods.com/commerce/v1/listing?query=${interaction.options.getString("product")}`,
                { headers: headers, proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err.response)
            return await interaction.editReply("Error searching for product")
        }
        if (query.data.products.totalItems === 0) {
            return await interaction.editReply(`No results matching ${interaction.options.getString("product")}`)
        }
        try {
            product = await instance.get(
                `https://api.stadiumgoods.com/commerce/v1/products/${query.data.products.entries[0].id}`,
                { headers: headers, proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            return await interaction.editReply("Error fetching product info")
        }
        const variants = product.data.result.variants.filter((item) => item.quantity !== 0)
        let sizeList = []
        for (let i = 0, n = variants.length; i < n; i++) {
            sizeList.push(
                `${variants[i].sizeDescription} ${variants[i].scaleAbbreviation}- ${variants[i].formattedPrice} [${variants[i].quantity}]\n`
            )
        }
        const embed = new EmbedBuilder()
            .setTitle(`${product.data.result.brand.name.charAt(0).toUpperCase() + product.data.result.brand.name.slice(1)} ${product.data.result.shortDescription} ${product.data.result.sku}`)
            .setURL(`https://www.stadiumgoods.com/en-us/shopping/${product.data.slug}`)

        if (!sizeList.length) embed.setDescription("No asks found")
        else if (sizeList.length < 8) {
            embed.addFields({ name: "Asks and Stock", value: sizeList.join("") })
        } else if (sizeList.length < 24) {
            const first = sizeList.slice(0, Math.round(sizeList.length / 2)).join("")
            const second = sizeList.slice(Math.round(sizeList.length / 2), sizeList.length).join("")
            embed.addFields(
                { name: "Asks and Stock", value: first, inline: true },
                { name: "\u200b", value: second, inline: true }
            )
        } else {
            const first = sizeList.slice(0, Math.round((sizeList.length * 1) / 3)).join("")
            const second = sizeList.slice(Math.round((sizeList.length * 1) / 3), Math.round((sizeList.length * 2) / 3)).join("")
            const third = sizeList.slice(Math.round((sizeList.length * 2) / 3), sizeList.length).join("")
            embed.addFields(
                { name: "Asks and Stock", value: first, inline: true },
                { name: "\u200b", value: second, inline: true },
                { name: "\u200b", value: third, inline: true }
            )
        }
        await interaction.editReply({ embeds: [embed] })
    },
}
