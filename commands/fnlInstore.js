import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import config from "./config.json" assert { type: "json" };

export default {
    data: new SlashCommandBuilder()
        .setName("fnl-instore")
        .setDescription("Finishline instore stock checker")
        .addStringOption((option) => option.setName("zipcode").setDescription("zipcode").setRequired(true))
        .addStringOption((option) => option.setName("prodid").setDescription("product id").setRequired(true))
        .addStringOption((option) => option.setName("sku").setDescription("product sku").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()

        const proxy = getProxy()
        const prodId = interaction.options.getString("prodid")
        const styleId = interaction.options.getString("sku").split("-")[0].toUpperCase()
        const colorId = interaction.options.getString("sku").split("-")[1]

        let coordinates, storeQuery
        try {
            coordinates = await instance.get(
                `https://maps.googleapis.com/maps/api/geocode/json?key=${config.googleAPIKey}&address=${interaction.options.getString("zipcode")}`,
                { proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply({ content: "Error fetching coordinates" })
        }
        if (coordinates.data.results[0] === undefined) {
            return await interaction.editReply({ content: "Zipcode does not exist" })
        }
        try {
            storeQuery = await instance.get(
                `https://www.finishline.com/store/storepickup/storeLookup.jsp?latitude=${coordinates.data.results[0].geometry.location.lat}&longitude=${coordinates.data.results[0].geometry.location.lng}`,
                { proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply({ content: "Error fetching stores" })
        }

        const embed = new EmbedBuilder()

        for (let i = 0; i < storeQuery.data.stores.length; i++) {
            let stockQuery
            try {
                stockQuery = await instance.get(
                    `https://www.finishline.com/store/browse/json/productSizesJson.jsp?productId=${prodId}&styleId=${styleId}&colorId=${colorId}&storeId=${storeQuery.data.stores[i].id}`,
                    { proxy: false, httpsAgent: proxy }
                )
            } catch (err) {
                console.log(err)
                return await interaction.editReply({ content: "Error fetching stock" })
            }

            let stockList = []
            stockQuery.data.productStoreSizes.forEach((variant) => {
                if (variant.productId !== "null") {
                    if (Buffer.from(variant.stockLevel, "base64").toString() > 0) {
                        stockList.push(`${variant.sizeValue} [${Buffer.from(variant.stockLevel, "base64").toString()}]\n`)
                    }
                }
            })
            if (stockList.length > 0) {
                embed.addFields({ name: storeQuery.data.stores[i].name, value: stockList.join(""), inline: true })
            }
        }

        embed
            .setTitle(`Finishline Instore Check- ${styleId}-${colorId}`)
            .setURL(`https://www.finishline.com/store/product/~/${prodId}?styleId=${styleId}&colorId=${colorId}`)

        await interaction.editReply({ embeds: [embed] })
    },
}
