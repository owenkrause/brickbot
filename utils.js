import fs from "fs";
import axios from "axios";
import mongoose from "mongoose";
import { HttpsProxyAgent } from "hpagent";
import config from "./config.json" assert { type: "json" };

export const instance = axios.create({
    headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
    },
});

export const getProxy = () => {
    const proxies = fs.readFileSync("proxies.txt", "utf8").split("\n");
    const index = Math.floor(Math.random() * proxies.length);
    const proxy = proxies[index].trim().split(":");
    return new HttpsProxyAgent({
        keepAlive: true,
        proxy: `http://${proxy[2]}:${proxy[3]}@${proxy[0]}:${proxy[1]}`,
    });
};

export const connect = async () => {
    await mongoose.connect(
        `mongodb+srv://${config.mongoUser}:${config.mongoPass}@monitor-db.pxm2j.mongodb.net/brickbot`
    );
    console.log("Connected to database");
};

export const disconnect = async () => {
    await mongoose.connection.close();
};

const memberSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        successPoints: { type: Number, required: true },
    },
    { versionKey: false }
);

export const Member = mongoose.model("Member", memberSchema);
