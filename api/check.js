// api/check.js

const axios = require("axios");
const cheerio = require("cheerio");

function extractPrice(text) {
  const num = text.replace(/[^\d]/g, "");
  return num ? parseInt(num) : null;
}

async function getAgoda() {
  try {
    const url = "https://www.agoda.com/zh-tw/remm-roppongi/hotel/tokyo-jp.html?checkIn=2025-12-05&checkOut=2025-12-10&rooms=1&adults=2";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/NT\$?\s?[\d,]+/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Agoda error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

async function getBooking() {
  try {
    const url = "https://www.booking.com/hotel/jp/remm-roppongi.zh-tw.html?checkin=2025-12-05&checkout=2025-12-10&group_adults=2&no_rooms=1";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/NT\$?\s?[\d,]+/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Booking error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

async function getExpedia() {
  try {
    const url = "https://www.expedia.com.tw/Tokyo-Hotels-Remm-Roppongi.h18727673.Hotel-Information?chkin=2025-12-05&chkout=2025-12-10";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/NT\$?\s?[\d,]+/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Expedia error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

async function getHotels() {
  try {
    const url = "https://zh.hotels.com/ho622433/remm-roppongi-dong-jing-ri-ben/?q-check-in=2025-12-05&q-check-out=2025-12-10";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/NT\$?\s?[\d,]+/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Hotels.com error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

async function getOfficial() {
  try {
    const url = "https://www.remm.jp/roppongi/";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/[\d,]+円/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Official site error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

async function getJalan() {
  try {
    const url = "https://www.jalan.net/yad345766/";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/[\d,]+円/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Jalan error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

async function getJapanican() {
  try {
    const url = "https://www.japanican.com/hotel/detail/4017A20/";
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const body = $("body").text();
    const match = body.match(/[\d,]+円/);
    const price = match ? extractPrice(match[0]) : null;
    return { price, text: match ? match[0] : "查詢失敗", link: url };
  } catch (err) {
    console.error("Japanican error:", err.message);
    return { price: null, text: "查詢失敗", link: null };
  }
}

module.exports = async (req, res) => {
  try {
    const now = new Date();
    const time = now.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    const sources = await Promise.all([
      getAgoda(),
      getBooking(),
      getExpedia(),
      getHotels(),
      getOfficial(),
      getJalan(),
      getJapanican()
    ]);

    const [agoda, booking, expedia, hotels, official, jalan, japanican] = sources;

    const allSources = [
      { name: "Agoda", ...agoda },
      { name: "Booking", ...booking },
      { name: "Expedia", ...expedia },
      { name: "Hotels.com", ...hotels },
      { name: "remm官網", ...official },
      { name: "Jalan", ...jalan },
      { name: "Japanican", ...japanican }
    ];

    const under4k = allSources.filter(s => s.price && s.price < 4000);

    if (under4k.length > 0) {
      const best = under4k.reduce((a, b) => (a.price < b.price ? a : b));
      return res.status(200).json({
        status: "available",
        platform: best.name,
        price: `NT$${best.price}`,
        link: best.link,
        time
      });
    } else {
      return res.status(200).json({
        status: "unavailable",
        agoda: agoda.text,
        booking: booking.text,
        expedia: expedia.text,
        hotels: hotels.text,
        official: official.text,
        jalan: jalan.text,
        japanican: japanican.text,
        time
      });
    }
  } catch (err) {
    console.error("/api/check error:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};
