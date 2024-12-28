import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("nike-instore")
        .setDescription("Nike instore stock checker")
        .addStringOption((option) => option.setName("sku").setDescription("sku").setRequired(true))
        .addStringOption((option) => option.setName("zipcode").setDescription("zipode").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()
        const embed = new EmbedBuilder()

        const proxy = getProxy()
        const params = `(((brand==NIKE and facilityType==NIKE_OWNED_STORE or facilityType==FRANCHISEE_PARTNER_STORE or facilityType==MONO_BRAND_NON_FRANCHISEE_PARTNER_STORE)) and (coordinates=geoProximity={"maxDistance": 50, "measurementUnits": "mi", "postalCode": "${interaction.options.getString("zipcode")}"}))`
        let storeQuery, gtinConversion

        try {
            storeQuery = await instance.get(
                `https://api.nike.com/store/store_locations/v1?search=${encodeURI(params)}`,
                { proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply({ content: "Error fetching stores" })
        }
        if (storeQuery === undefined) {
            return await interaction.editReply({ content: "Invalid zipcode" })
        }
        try {
            gtinConversion = await instance.get(
                `https://api.nike.com/product_feed/threads/v2?filter=language(en)&filter=marketplace(US)&filter=channelId(d9a5bc42-4b9c-4976-858a-f159cf99c647)&filter=productInfo.merchProduct.styleColor(${interaction.options.getString("sku").toUpperCase()})`,
                { proxy: false, httpsAgent: proxy }
            )
        } catch (err) {
            console.log(err)
            return await interaction.editReply({ content: "Gtin conversion failed" })
        }
        if (gtinConversion.data.objects.length === 0) {
            return await interaction.editReply({ content: "Invalid SKU" })
        }

        for (let i = 0, n = storeQuery.data.objects.length; i < n; i++) {
            let stockQuery
            try {
                stockQuery = await instance.get(
                    `https://api.nike.com/deliver/available_gtins/v3?filter=styleColor(${interaction.options.getString("sku").toUpperCase()})&filter=storeId(${storeQuery.data.objects[i].id})&filter=method(INSTORE)`,
                    { proxy: false, httpsAgent: proxy }
                )
            } catch (err) {
                console.log(err)
                if (err.response) {
                    if (err.response.status === 400) return
                } else interaction.editReply({ content: "Error fetching stock" })
            }

            let stockList = []
            if (stockQuery)
                stockQuery.data.objects.forEach((variant) => {
                    if (variant.level !== "OOS") {
                        try {
                            stockList.push(`${gtinConversion.data.objects[0].productInfo[0].skus.find((x) => x.gtin === variant.gtin).nikeSize}-  ${variant.level}\n`)
                        } catch { stockList.push(`${variant.level}\n`) }
                    }
                })
            if (stockList.length > 0) {
                embed.addFields({ 
                    name: storeQuery.data.objects[i].name, 
                    value: stockList.join(""), 
                    inline: true 
                })
            }
        }
        embed
            .setTitle(gtinConversion.data.objects[0].productInfo[0].productContent.title)
            .setURL(`https://www.nike.com/t/~/${interaction.options.getString("sku").toUpperCase()}`)
            .setThumbnail(gtinConversion.data.objects[0].productInfo[0].imageUrls.productImageUrl)
            .setDescription(`
                SKU- ${gtinConversion.data.objects[0].productInfo[0].merchProduct.styleColor} 
                Price- ${gtinConversion.data.objects[0].productInfo[0].merchPrice.currentPrice.toString()}
            `)
        await interaction.editReply({ embeds: [embed] })
    },
}
