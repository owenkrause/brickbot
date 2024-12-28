import crypto from "crypto"
import axios from "axios"
import { instance, getProxy } from "../utils.js"
import { SlashCommandBuilder, EmbedBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName("lvr")
        .setDescription("LVR stock checker")
        .addStringOption((option) => option.setName("id").setDescription("product id").setRequired(true))
        .addStringOption((option) => option.setName("color").setDescription("color id").setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply()
        const embed = new EmbedBuilder()

        const date = new Date().getTime()

        const startTime = Math.floor((date - 300000) / 1000)
        const endTime = Math.floor((date + 1800000) / 1000)
        const key = new Uint8Array([142, 167, 155, 206, 195, 213, 69, 151, 239, 225, 134, 120, 10, 131, 92, 7, 84, 0, 98, 58, 17, 72, 29, 61, 23, 221, 146, 233, 5, 219, 182, 21])
        const hmac = crypto
            .createHmac("sha256", key)
            .update(`st=${startTime}~exp=${endTime}~acl=*`)
            .digest("hex")

        const headers = {
            "accept": "application/json",
            "env": "PROD",
            "__lvr_mobile_api_token__": `st=${startTime}~exp=${endTime}~acl=*~hmac=${hmac}`,
            "user-agent": "LVR/2.0.931 (iPhone iOS 15.8.3)",
            "accept-language": "en-US,enq=0.9",
            "accept-encoding": "gzip, deflate, br",
            "cookie": "lna=eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..pOBQoXfLoJv32bTv3pSTGg.gmyjdAEJHc1fBwNma-9yqGkguUuDoskwYo6W0uNFYdnm1qhspr4hmJM7gnuGSqgPorMmmFQnOcr3_bbQ8Vlh4vytwpn6Y5J1NfuyIq9ut4pLaXZ5MexCy_HfiSwimypByiCjP_AwGHzQo-hrW6BD1pWW5cGJvvWMdbr3bF9r2PE.BBOpsv55ERUtRy4i9s5AQQlnb=ZTNjOTRmZDBlYWE4MjYyOWMxZjJjZjM0YzhhM2EyZDAzZDEyN2Y3MTk5NTlhODQyMGY5YWU3MzcyYzAwYWVkNA==_/@#/1_/@#/1724119046"
        }

        let response
        try {
            const sku = `${interaction.options.getString("id").replace("-", "")}-${interaction.options.getString("color")}`
            response = await axios.get(
                `https://api.luisaviaroma.com/lvrapprk/public/v1/catalog/widgetcatalogbyskus?PlainSkus=${sku}&Language=EN&Country=US&CurrencyView=USD&CurrencyFatt=USD&App=true&format=json`, 
                { headers: headers, proxy: false, httpsAgent: getProxy() }
            )
            embed
                .setURL("https://www.luisaviaroma.com/" + response.data.Items[0].Url)
                .setThumbnail(response.data.ImagePath + response.data.Items[0].Image)
                
            const collectionId = response.data.Items[0].ItemParameters.CollectionId
            const genderMemo = response.data.Items[0].ItemParameters.GenderMemo
            const itemCode = response.data.Items[0].ItemParameters.ItemCode
            const itemId = response.data.Items[0].ItemParameters.ItemId
            const seasonId = response.data.Items[0].ItemParameters.SeasonId
            const seasonMemo = response.data.Items[0].ItemParameters.SeasonMemo
            response = await axios.get(
                `https://api.luisaviaroma.com/lvrapprk/public/v1/itemminimal?CollectionId=${collectionId}&GenderMemo=${genderMemo}&ItemCode=${itemCode}&ItemId=${itemId}&SeasonId=${seasonId}&SeasonMemo=${seasonMemo}&Language=EN&Country=US&CurrencyView=USD&CurrencyFatt=USD&App=true&format=json`,
                { headers: headers, proxy: false, httpsAgent: getProxy() }
            )
        } catch (err) {
            console.log(err)
            await interaction.editReply("Error fetching stock")
            return
        }

        const embedFormat = []
        for (const item of response.data.AvailabilityByColor) {
            if (item.EncodedVendorColorId != interaction.options.getString("color")) continue
            for (const size of item.SizeAvailability) {
                embedFormat.push(`${size.SizeValue} - ${size.QuantitiesTotal.Available}\n`)
            }
        }
        embed
            .setTitle(`${response.data.DesignerText} ${response.data.DescriptionText}`)
            .setDescription(`Price: ${response.data.Discount}`)
        
        if (embedFormat.length < 8) {
            embed.addFields({
                name: "Stock",
                value: embedFormat.join(""),
            })
        } else {
            const first = embedFormat.slice(0, Math.round(embedFormat.length / 2)).join("")
            const second = embedFormat.slice(Math.round(embedFormat.length / 2), embedFormat.length).join("")
            embed.addFields(
                { name: "Stock", value: first, inline: true },
                { name: "\u200b", value: second, inline: true }
            )
        }

        await interaction.editReply({ embeds: [embed] })
    },
}
