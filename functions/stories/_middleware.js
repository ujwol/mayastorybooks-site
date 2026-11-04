// Player link share tags — per-book Open Graph for link previews.
//
// The player is one shared file (stories/jaden.html) for all 20 books, so
// its static HTML cannot carry per-book share tags. This middleware runs
// only for /stories/* requests and only changes the response for known
// link-preview crawlers asking for the player with a ?book=N parameter:
// it serves the same player HTML with that book's title, description and
// thumbnail injected as og: tags. Every other request — all human visitors,
// all other /stories/* files, and player links without a known book —
// passes through to the normal static file untouched.
//
// Book titles/descriptions mirror the book pages (books/bookN); Nepali
// titles come from each book's storytime/bookN-ne.json title field.

const BOOKS = {
  1: { en: "The Dog Who Wore Marigolds", ne: "सयपत्री लगाउने कुकुर।", desc: "The Dog Who Wore Marigolds — A scruffy stray crashes Kukur Tihar — and one little girl's marigold garland changes everything. The story that started it all. Free to read in English and Nepali, ages 3–7." },
  2: { en: "Maya and the Temple Monkey", ne: "माया र मन्दिरको बाँदर।", desc: "Maya and the Temple Monkey — A cheeky monkey snatches Maya's marigold offering at Swayambhunath — the chase up the 365 steps ends in a gentle surprise about kindness and sharing. Free to read in English and Nepali, ages 3–7." },
  3: { en: "Maya and the Rhino of Chitwan", ne: "माया र चितवनको गैंडा।", desc: "Maya and the Rhino of Chitwan — A jungle safari turns into a rescue mission when Maya meets a baby rhino in trouble. Brave hearts come in small sizes. Free to read in English and Nepali, ages 3–7." },
  4: { en: "Maya and the Clay Diyo", ne: "माया र माटोको दियो।", desc: "Maya and the Clay Diyo — Grandmother's clay oil lamp won't light — until Maya discovers what makes a tiny flame brave enough to glow. Free to read in English and Nepali, ages 3–7." },
  5: { en: "Maya and the Garden of Peace", ne: "माया र शान्तिको बगैंचा।", desc: "Maya and the Garden of Peace — In the quiet gardens of Lumbini, Maya plants a tiny bodhi sapling — and makes a wish too soft for words. Free to read in English and Nepali, ages 3–7." },
  6: { en: "Maya and the Baby Yak", ne: "माया र सानो चौँरी।", desc: "Maya and the Baby Yak — High in the mountains, Maya and Moti follow tiny hoofprints to find a lost baby yak — and Moti earns a brass bell for his tracking. Free to read in English and Nepali, ages 3–7." },
  7: { en: "Maya and Indra Jatra", ne: "माया र इन्द्रजात्रा।", desc: "Maya and Indra Jatra — Drums, masked dancers, and the living goddess roll through Basantapur — and Maya lights a lamp for someone she loves and misses. Free to read in English and Nepali, ages 3–7." },
  8: { en: "Maya and the Honey Hunters", ne: "माया र महशिकारीहरू।", desc: "Maya and the Honey Hunters — On a cliff tall as a hundred houses, Bir Dai the honey hunter climbs a bamboo ladder — and Maya tastes honey like sunshine and flowers. Free to read in English and Nepali, ages 3–7." },
  9: { en: "Maya and the Yeti's Sneeze", ne: "माया र यतीको हाच्छिउँ।", desc: "Maya and the Yeti's Sneeze — A giant sneeze shakes the snowy mountain — and Maya, Grandmother, and Moti nurse a shy, shaggy yeti back to health with tea and the biggest red scarf. Free to read in English and Nepali, ages 3–7." },
  10: { en: "Maya and the Kite Thief of Dashain", ne: "Maya and the Kite Thief of Dashain", desc: "Maya and the Kite Thief of Dashain — Someone keeps stealing kites from the Dashain sky. Maya follows the string to a thief with a surprising secret. Free to read in English and Nepali, ages 3–7." },
  11: { en: "Maya and the Bhai Tika Brother", ne: "माया र भाइटीकाका भाइ।", desc: "Maya and the Bhai Tika Brother — Maya has no brother for Bhai Tika — so she chooses one with her heart, and paints seven colors of wishes on his forehead. Free to read in English and Nepali, ages 3–7." },
  12: { en: "Maya and the Monk of Boudhanath", ne: "माया र बौद्धनाथका भिक्षु।", desc: "Maya and the Monk of Boudhanath — Cross about a chewed drawing, Maya sweeps the stupa courtyard with an old monk — and writes her anger on a paper prayer flag for the wind to carry away. Free to read in English and Nepali, ages 3–7." },
  13: { en: "Maya and the Lake of Pokhara", ne: "माया र पोखराको ताल।", desc: "Maya and the Lake of Pokhara — On Phewa Lake the mountains are painted twice — once in the sky, once in the water — and Moti barks at the little white dog in the lake. Free to read in English and Nepali, ages 3–7." },
  14: { en: "Maya and the Road to Everest", ne: "माया र सगरमाथाको बाटो।", desc: "Maya and the Road to Everest — One brave step at a time, Maya walks the mountain trail all the way to Everest Base Camp — and ties a blessed kata scarf to the prayer flags. Free to read in English and Nepali, ages 3–7." },
  15: { en: "Maya's Big Festival", ne: "मायाको ठूलो चाडपर्व।", desc: "Maya's Big Festival — Maya invites every friend she ever made — the yeti, the kite boy, the monk, and Bir Dai — to one big festival in her lane. Free to read in English and Nepali, ages 3–7." },
  16: { en: "Maya and the Goddess's Courage", ne: "Maya and the Goddess's Courage", desc: "Maya and the Goddess's Courage — When the big boys won't share the great Dashain swing, Grandmother's tale of goddess Durga gives Maya her bravest word: “Stop.” Free to read in English and Nepali, ages 3–7." },
  17: { en: "Maya and the Monkey King", ne: "माया र बाँदर राजा।", desc: "Maya and the Monkey King — Grandmother tells of a monkey king who became a bridge so his whole troop could escape — and Maya shares her biggest mango, just like him. Free to read in English and Nepali, ages 3–7." },
  18: { en: "Maya and the Two Arrows", ne: "माया र दुई बाण।", desc: "Maya and the Two Arrows — A scraped knee is one arrow — but a whole grumpy afternoon is a second arrow Maya shoots herself, until Grandmother's old story helps her put it down. Free to read in English and Nepali, ages 3–7." },
  19: { en: "Maya and the Wind of Mustang", ne: "माया र मुस्ताङको हावा।", desc: "Maya and the Wind of Mustang — The Mustang wind steals Maya's red scarf — and teaches her that some things you catch by letting go. Free to read in English and Nepali, ages 3–7." },
  24: { en: "Maya and the Roof of the World", ne: "माया र संसारको छानो।", desc: "Maya and the Roof of the World — A faded photograph sends Maya and Grandmother over the roof of the world to Lhasa — to find Dolma, Grandmother's best friend of sixty years ago. Free to read in English and Nepali, ages 3–7." },
};

const CRAWLER = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|linkedinbot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|Pinterestbot|vkShare|SkypeUriPreview/i;

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function onRequest(context) {
  const { request, next, env } = context;
  try {
    const url = new URL(request.url);
    if (url.pathname !== "/stories/jaden" && url.pathname !== "/stories/jaden.html") {
      return next();
    }
    const ua = request.headers.get("user-agent") || "";
    if (!CRAWLER.test(ua)) return next();
    const n = Number(url.searchParams.get("book"));
    const book = BOOKS[n];
    if (!book) return next();
    const title =
      (url.searchParams.get("lang") === "ne" ? book.ne : book.en) +
      " — Maya's Storybooks (Book " + n + ", free)";
    const tags = [
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + esc(title) + '">',
      '<meta property="og:description" content="' + esc(book.desc) + '">',
      '<meta property="og:image" content="https://mayastorybooks.com/stories/img/yt-book' + n + '.jpg">',
      '<meta property="og:url" content="' + esc(url.toString()) + '">',
    ].join("\n");
    const res = await env.ASSETS.fetch(request);
    if (!res.ok) return next();
    const html = await res.text();
    if (!html.includes("</title>")) return next();
    const out = html.replace("</title>", "</title>\n" + tags);
    const headers = new Headers(res.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.delete("content-length");
    headers.set("cache-control", "no-store");
    return new Response(out, { status: res.status, headers });
  } catch (e) {
    return next();
  }
}
