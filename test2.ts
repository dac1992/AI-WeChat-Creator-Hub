import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function run() {
  const res = await fetch("https://www.tianapi.com/apiview/223");
  const html = await res.text();
  const $ = cheerio.load(html);
  console.log($("body").text().replace(/\s+/g, ' ').substring(0, 2000));
}
run();
