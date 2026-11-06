// Builds the hand-written SEO landing pages (static HTML, no React) into the site.
// Edit the PAGES content below, then run:  node tools/build-seo-pages.mjs
// The pages reuse the site's fonts and colours, post enquiries to /api/enquiry and
// carry their own structured data. Sitemap entries are added by this script too.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://mrityikaestates.com";
const UPDATED = "2026-11-06";
const PHONE = "+91 89743 32863";
const TEL = "+918974332863";
const WHATSAPP = "https://wa.me/918974332863";
const MAP = "https://www.google.com/maps?q=22.365765,88.3377421";
const GEO = { "@type": "GeoCoordinates", latitude: 22.365765, longitude: 88.3377421 };

// Facts shared by every page. Keep in sync with netlify/knowledge/shantiban-knowledge.md.
const F = {
  price: "₹20 lakh",
  priceNum: 2000000,
  plots: 220,
  plotSize: "2.5 katha",
  commercial: "72,000 sq ft",
  address: "Tapna, Baruipur–Amtala Road, Dist. South 24 Parganas, West Bengal – 700144",
  legalName: "MRITYIKA REALTERS (OPC) PRIVATE LIMITED",
  cin: "U45500WB2019OPC230083",
  gst: "19AAMCM3987F1ZV",
  kmc: "0206 3100 6731",
  office: "Unit 706, 7th Floor, Om Tower, 32 Chowringhee Road, Park Street, Kolkata – 700071",
};

const DISTANCES = [
  ["Nearest market", "500 m", "নিকটতম বাজার"],
  ["Nearest school", "1.5 km", "নিকটতম স্কুল"],
  ["Koyal More", "1.5 km", "কয়াল মোড়"],
  ["Nearest bus terminus", "1.5 km", "নিকটতম বাস টার্মিনাস"],
  ["Nearest hospital", "2 km", "নিকটতম হাসপাতাল"],
  ["Baruipur Happy Valley", "4 km", "বারুইপুর হ্যাপি ভ্যালি"],
  ["Baruipur District Headquarters", "4.5 km", "বারুইপুর জেলা সদর"],
  ["Baruipur Bypass", "7 km", "বারুইপুর বাইপাস"],
  ["Amtala More", "8 km", "আমতলা মোড়"],
  ["Garia Metro", "14 km", "গড়িয়া মেট্রো"],
  ["Joka Metro", "15 km", "জোকা মেট্রো"],
  ["Kolkata city", "20 km", "কলকাতা শহর"],
];

const ORG = {
  "@type": "RealEstateAgent",
  "@id": `${SITE}/#organization`,
  name: "MRITYIKA REALTERS OPC PRIVATE LIMITED",
  legalName: F.legalName,
  alternateName: ["Mrityika Realters", "Mrityika Estates"],
  url: `${SITE}/`,
  logo: `${SITE}/images/mrityika-logo.png`,
  telephone: "+91-8974332863",
  foundingDate: "2019-01-28",
  taxID: F.gst,
  identifier: [
    { "@type": "PropertyValue", propertyID: "CIN", value: F.cin },
    { "@type": "PropertyValue", propertyID: "GSTIN", value: F.gst },
    { "@type": "PropertyValue", propertyID: "KMC Certificate of Enlistment", value: F.kmc },
  ],
  address: { "@type": "PostalAddress", streetAddress: "Unit 706, 7th Floor, Om Tower, 32 Chowringhee Road, Park Street", addressLocality: "Kolkata", postalCode: "700071", addressRegion: "West Bengal", addressCountry: "IN" },
  areaServed: ["Baruipur", "South 24 Parganas", "Kolkata", "West Bengal"],
};
const PLACE = {
  "@type": ["Place", "Residence"],
  "@id": `${SITE}/#shantiban-city`,
  name: "Shantiban City",
  address: { "@type": "PostalAddress", streetAddress: "Tapna, Baruipur–Amtala Road", addressLocality: "Baruipur", addressRegion: "West Bengal", postalCode: "700144", addressCountry: "IN" },
  geo: GEO,
  hasMap: MAP,
};
const LISTING = (url, lang) => ({
  "@type": "RealEstateListing",
  "@id": `${url}#listing`,
  name: lang === "bn" ? "শান্তিবন সিটি, বারুইপুরে প্লট" : "Plots for sale at Shantiban City, Baruipur",
  url,
  datePosted: UPDATED,
  about: { "@id": `${SITE}/#shantiban-city` },
  offers: { "@type": "Offer", priceCurrency: "INR", price: F.priceNum, priceSpecification: { "@type": "PriceSpecification", minPrice: F.priceNum, priceCurrency: "INR" }, availability: "https://schema.org/InStock", seller: { "@id": `${SITE}/#organization` } },
});

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- page content ----------
// Body blocks: ["h2", text] ["p", html] ["ul", [html...]] ["table", [[a,b]...]] ["img", src, alt, caption] ["facts"] ["distances"] ["cta"]
const PAGES = [
  {
    slug: "plots-in-baruipur",
    lang: "en",
    alt: "bn/plots-in-baruipur",
    title: "Plots for Sale in Baruipur from ₹20 Lakh | Shantiban City, Tapna",
    description: "Buy a residential plot in Baruipur, 20 km from Kolkata. Shantiban City in Tapna offers 2.5 katha plots from ₹20 lakh in a gated community with wide roads, drainage, electricity and a park. Ready to register now.",
    h1: "Plots for sale in Baruipur",
    lead: `Shantiban City is a gated residential plot community in Tapna, Baruipur, about 20 km from Kolkata. Plots of ${F.plotSize} start from ${F.price}, and you can register and take possession of your plot now while the community's shared facilities are developed in phases.`,
    crumb: "Plots in Baruipur",
    body: [
      ["facts"],
      ["h2", "Why buy a plot in Baruipur?"],
      ["p", "Baruipur is the headquarters of South 24 Parganas district and one of the fastest-growing residential belts south of Kolkata. Land here still costs a fraction of what it does inside the city, while daily needs, schools, hospitals and transport are already in place."],
      ["ul", [
        "<strong>Close to the city:</strong> about 20 km from Kolkata, with Garia Metro about 14 km and Joka Metro about 15 km away.",
        "<strong>Everyday life is already here:</strong> a market about 500 m away, a school and bus terminus about 1.5 km away and a hospital about 2 km away.",
        "<strong>Room to build your own way:</strong> a plot lets you design the home your family wants and build at your own pace, instead of buying a fixed apartment.",
        "<strong>Calm surroundings:</strong> greenery, less traffic and less noise than the city, which is why many Kolkata families now look south.",
      ]],
      ["h2", "Is Shantiban City ready to move or still developing?"],
      ["p", "Both, and it helps to be clear about what that means. <strong>Ready to move:</strong> plots are available now, registration can be done straight away, and our team helps buyers identify their plot and complete boundary work. <strong>Developing:</strong> the community's shared infrastructure, including wide internal roads, concrete drainage, electricity, the park, community hall and shop spaces, is being built out step by step. Visit the site to see the current progress for yourself."],
      ["img", "/images/site-boundary-work.webp", "Plot boundary walls built for buyers at Shantiban City, Tapna, Baruipur", "Boundary work completed for buyers at Shantiban City (site photo)."],
      ["h2", "What is included in the community"],
      ["ul", [
        "Gated entry with security",
        "Wide internal roads",
        "Concrete drainage",
        "Electricity connection",
        "A landscaped park and open green space",
        "Community hall",
        `Designated shop and commercial spaces (${F.commercial} in total)`,
      ]],
      ["img", "/images/master-plan.webp", "Master plan of Shantiban City showing residential plots and internal roads", "Master plan of Shantiban City."],
      ["h2", "How far is Shantiban City from key places?"],
      ["distances"],
      ["p", `All distances are approximate. A metro extension towards this area has been proposed, but it is not operational, so plan your commute around today's roads and metro stations.`],
      ["img", "/images/location-segments.webp", "Location map of Shantiban City in Tapna, Baruipur with nearby landmarks", "Location map with nearby landmarks."],
      ["h2", "Who is the developer?"],
      ["p", `Shantiban City is developed by ${F.legalName}, a Kolkata company incorporated on 28 January 2019 (CIN ${F.cin}). It holds a Kolkata Municipal Corporation Certificate of Enlistment as a real estate developer and is GST registered (${F.gst}). See the <a href="/shantiban-city-fact-sheet/">project fact sheet</a> for full details.`],
      ["cta"],
    ],
    faq: [
      ["What is the price of a plot in Shantiban City, Baruipur?", `Plots start from ${F.price}. The final price depends on the plot's size and position. Ask our team for the exact total, including registration and stamp duty, for the plot you like.`],
      ["What size are the plots?", `Residential plots are ${F.plotSize} each, which is roomy enough for a family home with open space. There are ${F.plots} plots in the community, plus commercial space.`],
      ["Is Shantiban City ready to move?", "Yes. Plots can be registered and handed over now, and buyers can start boundary work. The shared facilities such as roads, drainage, the park and community hall are being developed in phases."],
      ["How far is Shantiban City from Kolkata?", "About 20 km from Kolkata city. Garia Metro is about 14 km and Joka Metro about 15 km away, and the Baruipur Bypass is about 7 km away."],
      ["Where exactly is Shantiban City?", `In Tapna, Baruipur, South 24 Parganas, West Bengal (${F.address}).`],
      ["How do I book a site visit?", `Call or WhatsApp ${PHONE}, or fill in the form on this page, and our team will arrange a visit.`],
    ],
  },
  {
    slug: "bn/plots-in-baruipur",
    lang: "bn",
    alt: "plots-in-baruipur",
    title: "বারুইপুরে জমি / প্লট বিক্রি – ₹২০ লাখ থেকে | শান্তিবন সিটি, টাপনা",
    description: "কলকাতা থেকে মাত্র ২০ কিমি দূরে বারুইপুরের টাপনায় শান্তিবন সিটি। গেটেড কমিউনিটিতে ২.৫ কাঠার প্লট, দাম শুরু ₹২০ লাখ থেকে। এখনই রেজিস্ট্রি করা যায়।",
    h1: "বারুইপুরে প্লট বিক্রি",
    lead: "শান্তিবন সিটি বারুইপুরের টাপনায় একটি গেটেড আবাসিক প্লট কমিউনিটি, কলকাতা থেকে প্রায় ২০ কিমি দূরে। ২.৫ কাঠার প্লটের দাম শুরু ₹২০ লাখ থেকে। প্লট এখনই রেজিস্ট্রি করে বুঝে নেওয়া যায়, আর কমিউনিটির সুবিধাগুলি ধাপে ধাপে তৈরি হচ্ছে।",
    crumb: "বারুইপুরে প্লট",
    body: [
      ["facts"],
      ["h2", "বারুইপুরে জমি কেন কিনবেন?"],
      ["p", "বারুইপুর দক্ষিণ ২৪ পরগনা জেলার সদর এবং কলকাতার দক্ষিণে দ্রুত বেড়ে ওঠা আবাসিক এলাকা। শহরের তুলনায় এখানে জমির দাম অনেক কম, অথচ বাজার, স্কুল, হাসপাতাল আর যাতায়াতের ব্যবস্থা আগে থেকেই আছে।"],
      ["ul", [
        "<strong>শহরের কাছে:</strong> কলকাতা থেকে প্রায় ২০ কিমি, গড়িয়া মেট্রো প্রায় ১৪ কিমি এবং জোকা মেট্রো প্রায় ১৫ কিমি।",
        "<strong>রোজকার প্রয়োজন হাতের কাছে:</strong> বাজার প্রায় ৫০০ মিটার, স্কুল ও বাস টার্মিনাস প্রায় ১.৫ কিমি, হাসপাতাল প্রায় ২ কিমি।",
        "<strong>নিজের মতো বাড়ি:</strong> নিজের জমিতে পরিবারের পছন্দমতো বাড়ি বানান, নিজের সময়ে।",
        "<strong>শান্ত পরিবেশ:</strong> সবুজ, কম ভিড় আর কম আওয়াজ।",
      ]],
      ["h2", "শান্তিবন সিটি কি রেডি টু মুভ, নাকি এখনও তৈরি হচ্ছে?"],
      ["p", "দুটোই। <strong>রেডি টু মুভ:</strong> প্লট এখনই পাওয়া যাচ্ছে, সঙ্গে সঙ্গে রেজিস্ট্রি করা যায়, আর আমাদের টিম প্লট চিহ্নিত করা ও বাউন্ডারির কাজে সাহায্য করে। <strong>উন্নয়ন চলছে:</strong> চওড়া রাস্তা, কংক্রিটের ড্রেনেজ, বিদ্যুৎ, পার্ক, কমিউনিটি হল ও দোকানের জায়গা ধাপে ধাপে তৈরি হচ্ছে। সাইটে এসে নিজের চোখে কাজের অগ্রগতি দেখে যান।"],
      ["img", "/images/site-boundary-work.webp", "শান্তিবন সিটি, টাপনা, বারুইপুরে ক্রেতাদের প্লটের বাউন্ডারি ওয়াল", "ক্রেতাদের জন্য সম্পূর্ণ হওয়া বাউন্ডারির কাজ (সাইটের ছবি)।"],
      ["h2", "কমিউনিটিতে কী কী থাকছে"],
      ["ul", ["নিরাপত্তা সহ গেটেড প্রবেশপথ", "চওড়া অভ্যন্তরীণ রাস্তা", "কংক্রিটের ড্রেনেজ", "বিদ্যুৎ সংযোগ", "সাজানো পার্ক ও খোলা সবুজ জায়গা", "কমিউনিটি হল", "দোকান ও বাণিজ্যিক জায়গা (মোট ৭২,০০০ বর্গফুট)"]],
      ["img", "/images/master-plan.webp", "শান্তিবন সিটির মাস্টার প্ল্যান", "শান্তিবন সিটির মাস্টার প্ল্যান।"],
      ["h2", "গুরুত্বপূর্ণ জায়গা থেকে দূরত্ব"],
      ["distances"],
      ["p", "সব দূরত্ব আনুমানিক। এই এলাকার দিকে একটি মেট্রো সম্প্রসারণের প্রস্তাব আছে, তবে তা এখনও চালু নয়।"],
      ["h2", "ডেভেলপার কে?"],
      ["p", `শান্তিবন সিটি তৈরি করছে ${F.legalName}, ২৮ জানুয়ারি ২০১৯-এ নথিভুক্ত কলকাতার একটি কোম্পানি (CIN ${F.cin})। কোম্পানির কলকাতা পৌরসভার রিয়েল এস্টেট ডেভেলপার হিসেবে সার্টিফিকেট অফ এনলিস্টমেন্ট এবং GST রেজিস্ট্রেশন (${F.gst}) আছে। বিস্তারিত দেখুন <a href="/shantiban-city-fact-sheet/">প্রজেক্ট ফ্যাক্ট শিট</a>-এ।`],
      ["cta"],
    ],
    faq: [
      ["শান্তিবন সিটিতে প্লটের দাম কত?", "প্লটের দাম শুরু ₹২০ লাখ থেকে। চূড়ান্ত দাম প্লটের মাপ ও অবস্থানের উপর নির্ভর করে। রেজিস্ট্রেশন ও স্ট্যাম্প ডিউটি সহ সঠিক মোট খরচ জানতে আমাদের টিমের সঙ্গে কথা বলুন।"],
      ["প্লটের মাপ কত?", "প্রতিটি আবাসিক প্লট ২.৫ কাঠা। কমিউনিটিতে মোট ২২০টি প্লট আছে, সঙ্গে বাণিজ্যিক জায়গা।"],
      ["শান্তিবন সিটি কি রেডি টু মুভ?", "হ্যাঁ। প্লট এখনই রেজিস্ট্রি করে বুঝে নেওয়া যায় এবং বাউন্ডারির কাজ শুরু করা যায়। রাস্তা, ড্রেনেজ, পার্ক ও কমিউনিটি হল ধাপে ধাপে তৈরি হচ্ছে।"],
      ["কলকাতা থেকে শান্তিবন সিটি কত দূরে?", "কলকাতা শহর থেকে প্রায় ২০ কিমি। গড়িয়া মেট্রো প্রায় ১৪ কিমি, জোকা মেট্রো প্রায় ১৫ কিমি এবং বারুইপুর বাইপাস প্রায় ৭ কিমি দূরে।"],
      ["শান্তিবন সিটি ঠিক কোথায়?", "টাপনা, বারুইপুর, দক্ষিণ ২৪ পরগনা, পশ্চিমবঙ্গ – ৭০০১৪৫।"],
      ["সাইট ভিজিট কীভাবে বুক করব?", `${PHONE} নম্বরে ফোন বা হোয়াটসঅ্যাপ করুন, অথবা এই পাতার ফর্মটি পূরণ করুন।`],
    ],
  },
  {
    slug: "plots-near-kolkata",
    lang: "en",
    title: "Best Plots to Buy Near Kolkata in 2026: A Buyer's Guide | Shantiban City",
    description: "How to choose the best plot to buy near Kolkata: price, location, legal papers and infrastructure to check before you pay. Includes a look at Shantiban City in Baruipur, with 2.5 katha plots from ₹20 lakh.",
    h1: "Best plots to buy near Kolkata: a buyer's guide",
    lead: "Buying land near Kolkata can be the best decision your family makes, or an expensive mistake. This guide explains what separates a good plot from a risky one, which areas around Kolkata buyers are looking at, and how Shantiban City in Baruipur measures up.",
    crumb: "Plots near Kolkata: buyer's guide",
    article: true,
    body: [
      ["h2", "What makes a plot the \"best\" buy?"],
      ["p", "There is no single best plot for everyone. The right one is the plot that matches your budget, has clean legal papers, sits in a well-connected location, and is in a project that will actually get the roads, drainage and power it promises. Check these six things before you pay any advance:"],
      ["ul", [
        "<strong>Clear title and papers:</strong> ask for the deed, the latest record of rights (khatian/porcha), mutation and land conversion papers, and get them checked by your own lawyer.",
        "<strong>The developer:</strong> a registered company with a verifiable track record. Look up its CIN on mca.gov.in and its GST number.",
        "<strong>Connectivity today, not just promises:</strong> distance to the nearest metro, highway and railway station as things stand now.",
        "<strong>Daily needs nearby:</strong> market, school, hospital and transport within a few kilometres.",
        "<strong>Infrastructure inside the project:</strong> road width, drainage, electricity and boundary or gate security.",
        "<strong>The total cost:</strong> the plot price plus stamp duty, registration and any development charges.",
      ]],
      ["h2", "Popular areas for buying plots around Kolkata"],
      ["p", "Most plot buyers look at the edges of the city, where land is still affordable and connectivity is improving:"],
      ["table", [
        ["Area", "What buyers like", "What to weigh up"],
        ["Baruipur (south)", "District headquarters, established markets, schools and hospitals, lower land prices", "Commute by road or metro from Garia or Joka"],
        ["Sonarpur and Garia belt (south)", "Close to existing metro and the city", "Higher land prices, more crowded"],
        ["Joka and Thakurpukur (south-west)", "Metro access, growing institutions", "Prices rising quickly"],
        ["Rajarhat and New Town fringe (east)", "Planned roads, IT hub nearby", "Among the most expensive plot areas"],
      ]],
      ["p", "Prices change quickly and vary from street to street, so always compare current quotes for specific plots rather than area averages."],
      ["h2", "How Shantiban City in Baruipur compares"],
      ["facts"],
      ["ul", [
        `<strong>Price:</strong> plots from ${F.price}, for ${F.plotSize}.`,
        "<strong>Status:</strong> ready to register and take possession now; shared infrastructure is being developed in phases.",
        "<strong>Inside the community:</strong> gated entry and security, wide roads, concrete drainage, electricity, a park, community hall and shop spaces.",
        "<strong>Nearby:</strong> market about 500 m, school about 1.5 km, hospital about 2 km, Garia Metro about 14 km, Kolkata about 20 km.",
        `<strong>Developer:</strong> ${F.legalName}, CIN ${F.cin}, GST ${F.gst}.`,
      ]],
      ["img", "/images/site-plan.webp", "Site plan of Shantiban City with the central lake and plots", "Site plan of Shantiban City."],
      ["p", `Read more on our <a href="/plots-in-baruipur/">plots in Baruipur</a> page, or see the <a href="/shantiban-city-fact-sheet/">full fact sheet</a>.`],
      ["h2", "Visit before you decide"],
      ["p", "No brochure or website replaces standing on the land. Visit at least two projects, drive the route you would take every day, and talk to people who have already bought there."],
      ["cta"],
    ],
    faq: [
      ["Which is the best area to buy a plot near Kolkata?", "It depends on your budget and where you work. Baruipur offers lower land prices with established amenities; Sonarpur, Garia and Joka are closer to the metro but cost more; the Rajarhat and New Town fringe is planned but among the most expensive."],
      ["What should I check before buying land in West Bengal?", "Check the title deed, record of rights (khatian/porcha), mutation and land conversion papers with your own lawyer, verify the developer's company registration, and confirm the total cost including stamp duty and registration."],
      ["How much does a plot near Kolkata cost?", `It varies widely by area and plot. At Shantiban City in Baruipur, about 20 km from Kolkata, plots of ${F.plotSize} start from ${F.price}.`],
      ["Is buying a plot better than an apartment?", "A plot gives you land you fully own and the freedom to build your own home at your own pace, while an apartment is ready to live in but you share the land and building. Many families buy a plot as a long-term asset and build when ready."],
    ],
  },
  {
    slug: "shantiban-city-fact-sheet",
    lang: "en",
    title: "Shantiban City Fact Sheet: Price, Plot Size, Location & Developer Details",
    description: "Key facts about Shantiban City, Tapna, Baruipur: 220 plots of 2.5 katha from ₹20 lakh, distances, amenities, project status and developer registration details (CIN, GST, KMC enlistment).",
    h1: "Shantiban City fact sheet",
    lead: "All the key facts about Shantiban City in one place, kept up to date by the developer.",
    crumb: "Fact sheet",
    body: [
      ["h2", "Project at a glance"],
      ["table", [
        ["Project", "Shantiban City"],
        ["Type", "Gated residential plot community with commercial space"],
        ["Location", F.address],
        ["Distance from Kolkata", "About 20 km"],
        ["Total plots", String(F.plots)],
        ["Residential plot size", F.plotSize],
        ["Commercial space", F.commercial],
        ["Price", `From ${F.price} per plot`],
        ["Status", "Ready to register and take possession; shared infrastructure being developed in phases"],
        ["Community facilities", "Gated entry and security, wide roads, concrete drainage, electricity, park, community hall, shop spaces"],
        ["Site visits", `${PHONE} (call or WhatsApp)`],
        ["Last updated", "6 November 2026"],
      ]],
      ["h2", "Distances"],
      ["distances"],
      ["p", "All distances are approximate. A metro extension towards the area has been proposed but is not operational."],
      ["img", "/images/master-plan.webp", "Master plan of Shantiban City", "Master plan."],
      ["h2", "Developer details"],
      ["table", [
        ["Developer", F.legalName],
        ["Corporate Identity Number (CIN)", `${F.cin} (verify at mca.gov.in)`],
        ["Incorporated", "28 January 2019, under the Companies Act, 2013"],
        ["GSTIN", F.gst],
        ["KMC Certificate of Enlistment", `${F.kmc}, real estate developer (valid to 31 March 2027)`],
        ["Office", F.office],
        ["Phone", PHONE],
      ]],
      ["img", "/images/certificate-of-incorporation.jpg", "Certificate of Incorporation of Mrityika Realters (OPC) Private Limited", "Certificate of Incorporation issued by the Ministry of Corporate Affairs."],
      ["cta"],
    ],
    faq: [
      ["What is the starting price at Shantiban City?", `Plots start from ${F.price}.`],
      ["How many plots are there in Shantiban City?", `${F.plots} plots, with residential plots of ${F.plotSize}, plus ${F.commercial} of commercial space.`],
      ["Who is the developer of Shantiban City?", `${F.legalName}, CIN ${F.cin}, GSTIN ${F.gst}.`],
      ["Is Shantiban City ready to move?", "Yes, plots can be registered and handed over now, while the shared infrastructure is being developed in phases."],
    ],
  },
];

// ---------- rendering ----------
const T = {
  en: { home: "Home", call: "Call", wa: "WhatsApp", visit: "Book a site visit", formTitle: "Book a free site visit", formNote: "Share your details and our team will call you back, usually within the day.", name: "Your name", mobile: "Mobile number", email: "Email (optional)", type: "Interested in", res: "Residential plot", com: "Commercial plot", msg: "Message (optional)", send: "Request a call back", ok: "Thank you! Our team will call you shortly.", faq: "Frequently asked questions", from: "Plots from", size: "Plot size", total: "Total plots", dist: "From Kolkata", place: "Place", distance: "Approx. distance", other: "বাংলায় পড়ুন", updated: "Last updated 6 November 2026", footerNote: "Shantiban City is developed by" },
  bn: { home: "হোম", call: "ফোন", wa: "হোয়াটসঅ্যাপ", visit: "সাইট ভিজিট বুক করুন", formTitle: "বিনামূল্যে সাইট ভিজিট বুক করুন", formNote: "আপনার তথ্য দিন, আমাদের টিম সাধারণত সেদিনই ফোন করবে।", name: "আপনার নাম", mobile: "মোবাইল নম্বর", email: "ইমেল (ঐচ্ছিক)", type: "আগ্রহ", res: "আবাসিক প্লট", com: "বাণিজ্যিক প্লট", msg: "বার্তা (ঐচ্ছিক)", send: "কল ব্যাক চান", ok: "ধন্যবাদ! আমাদের টিম শীঘ্রই আপনাকে ফোন করবে।", faq: "সাধারণ প্রশ্ন", from: "দাম শুরু", size: "প্লটের মাপ", total: "মোট প্লট", dist: "কলকাতা থেকে", place: "জায়গা", distance: "আনুমানিক দূরত্ব", other: "Read in English", updated: "সর্বশেষ আপডেট ৬ নভেম্বর ২০২৬", footerNote: "শান্তিবন সিটি তৈরি করছে" },
};
const BN_DIGITS = (s) => s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[d]);

function block(b, t, lang) {
  const [kind, a, b2, c] = b;
  if (kind === "h2") return `<h2>${esc(a)}</h2>`;
  if (kind === "p") return `<p>${a}</p>`;
  if (kind === "ul") return `<ul>${a.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  if (kind === "table") {
    const head = a[0].length === 3;
    const rows = head ? a.slice(1) : a;
    return `<div class="tbl"><table>${head ? `<thead><tr>${a[0].map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>` : ""}<tbody>${rows.map((r) => `<tr>${r.map((x, i) => (i === 0 && !head ? `<th scope="row">${esc(x)}</th>` : `<td>${esc(x)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (kind === "img") return `<figure><img src="${a}" alt="${esc(b2)}" loading="lazy" decoding="async"><figcaption>${esc(c)}</figcaption></figure>`;
  if (kind === "facts") {
    const n = lang === "bn" ? BN_DIGITS : (s) => s;
    const items = [[t.from, lang === "bn" ? "₹২০ লাখ" : F.price], [t.size, lang === "bn" ? "২.৫ কাঠা" : F.plotSize], [t.total, n(String(F.plots))], [t.dist, lang === "bn" ? "~২০ কিমি" : "~20 km"]];
    return `<dl class="facts">${items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
  }
  if (kind === "distances") {
    return `<div class="tbl"><table><thead><tr><th>${t.place}</th><th>${t.distance}</th></tr></thead><tbody>${DISTANCES.map(([en, d, bn]) => `<tr><td>${esc(lang === "bn" ? bn : en)}</td><td>${esc(lang === "bn" ? BN_DIGITS(d).replace("km", "কিমি").replace("m", "মিটার") : d)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  if (kind === "cta") {
    return `<section class="cta" id="enquire"><h2>${t.formTitle}</h2><p>${t.formNote}</p>
<form class="enq" novalidate><label>${t.name}<input name="name" required autocomplete="name"></label><label>${t.mobile}<input name="mobile" type="tel" required autocomplete="tel" inputmode="tel"></label><label>${t.email}<input name="email" type="email" autocomplete="email"></label><label>${t.type}<select name="plot_type"><option value="Residential">${t.res}</option><option value="Commercial">${t.com}</option></select></label><label class="wide">${t.msg}<textarea name="message" rows="3"></textarea></label><button type="submit">${t.send}</button><p class="status" role="status" aria-live="polite"></p></form>
<div class="cta-links"><a class="btn" href="tel:${TEL}">${t.call} ${PHONE}</a><a class="btn alt" href="${WHATSAPP}" rel="noopener">${t.wa}</a></div></section>`;
  }
  throw new Error("unknown block " + kind);
}

function render(p) {
  const t = T[p.lang];
  const url = `${SITE}/${p.slug}/`;
  const altUrl = p.alt && `${SITE}/${p.alt}/`;
  const enUrl = p.lang === "en" ? url : altUrl;
  const crumbs = [{ name: t.home, item: `${SITE}/` }, { name: p.crumb, item: url }];
  const graph = [
    ORG,
    PLACE,
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: p.title, description: p.description, inLanguage: p.lang === "bn" ? "bn-IN" : "en-IN", dateModified: UPDATED, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#shantiban-city` }, publisher: { "@id": `${SITE}/#organization` } },
    { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })) },
    { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    LISTING(url, p.lang),
  ];
  if (p.article) graph.push({ "@type": "Article", "@id": `${url}#article`, headline: p.h1, description: p.description, datePublished: UPDATED, dateModified: UPDATED, author: { "@id": `${SITE}/#organization` }, publisher: { "@id": `${SITE}/#organization` }, image: `${SITE}/images/site-plan.webp`, mainEntityOfPage: url });
  const jsonld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  const hreflang = altUrl
    ? `<link rel="alternate" hreflang="${p.lang === "bn" ? "bn-IN" : "en-IN"}" href="${url}"><link rel="alternate" hreflang="${p.lang === "bn" ? "en-IN" : "bn-IN"}" href="${altUrl}"><link rel="alternate" hreflang="x-default" href="${enUrl}">`
    : "";

  return `<!DOCTYPE html>
<html lang="${p.lang === "bn" ? "bn" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">${hreflang}
<meta name="theme-color" content="#1f4e33">
<meta property="og:type" content="${p.article ? "article" : "website"}">
<meta property="og:site_name" content="Shantiban City">
<meta property="og:locale" content="${p.lang === "bn" ? "bn_IN" : "en_IN"}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/site-boundary-work.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/icon.png">
<link rel="stylesheet" href="/_next/static/css/f9892ede2fc710c8.css">
<link rel="stylesheet" href="/sbc/seo-pages.css">
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<header class="top"><div class="wrap"><a class="brand" href="/"><img src="/images/logo-mark.png" alt="" width="40" height="40"><span>Shantiban <em>City</em><small>Mrityika Realters</small></span></a>
<nav aria-label="Main"><a href="/plots-in-baruipur/">${p.lang === "bn" ? "বারুইপুরে প্লট" : "Plots in Baruipur"}</a><a href="/plots-near-kolkata/">${p.lang === "bn" ? "ক্রেতার গাইড" : "Buyer's guide"}</a><a href="/shantiban-city-fact-sheet/">${p.lang === "bn" ? "ফ্যাক্ট শিট" : "Fact sheet"}</a>${altUrl ? `<a href="/${p.alt}/" hreflang="${p.lang === "bn" ? "en" : "bn"}">${t.other}</a>` : ""}</nav>
${altUrl ? "" : `<span data-sbc-lang-slot></span>`}<a class="btn small" href="#enquire">${t.visit}</a></div></header>
<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">${t.home}</a> › <span>${esc(p.crumb)}</span></nav>
<article>
<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.lead)}</p>
<p class="updated">${t.updated}</p>
${p.body.map((b) => block(b, t, p.lang)).join("\n")}
<section class="faq"><h2>${t.faq}</h2>${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>
</article>
</main>
<footer class="foot"><div class="wrap"><p><strong>Shantiban City</strong> · ${esc(F.address)} · <a href="tel:${TEL}">${PHONE}</a> · <a href="${MAP}" rel="noopener">${p.lang === "bn" ? "ম্যাপে দেখুন" : "View on map"}</a></p>
<p>${t.footerNote} ${esc(F.legalName)} · CIN ${F.cin} · GSTIN ${F.gst}</p>
<p><a href="/">${t.home}</a> · <a href="/about/">${p.lang === "bn" ? "আমাদের কথা" : "About"}</a> · <a href="/contact/">${p.lang === "bn" ? "যোগাযোগ" : "Contact"}</a> · <a href="/plots-in-baruipur/">Plots in Baruipur</a> · <a href="/bn/plots-in-baruipur/">বারুইপুরে প্লট</a> · <a href="/plots-near-kolkata/">Plots near Kolkata</a> · <a href="/shantiban-city-fact-sheet/">Fact sheet</a></p></div></footer>
<a class="wa-float" href="${WHATSAPP}" rel="noopener" aria-label="${t.wa}">${t.wa}</a>
${altUrl ? "" : `<script src="/sbc/lang.js" defer></script>\n`}<script>
document.querySelectorAll("form.enq").forEach(function (f) {
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var s = f.querySelector(".status"), b = f.querySelector("button"), d = Object.fromEntries(new FormData(f));
    d.message = (d.message ? d.message + " — " : "") + "Page: " + location.pathname;
    b.disabled = true; s.textContent = "…";
    fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (x.ok) { f.reset(); s.textContent = ${JSON.stringify(t.ok)}; } else { s.textContent = x.j.error || "Please try again."; } })
      .catch(function () { s.textContent = "Please try again."; })
      .finally(function () { b.disabled = false; });
  });
});
</script>
</body>
</html>
`;
}

for (const p of PAGES) {
  const dir = path.join(ROOT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), render(p));
  console.log("wrote", `/${p.slug}/`);
}

// Sitemap: add (or refresh) the entries for these pages, with language alternates.
const smPath = path.join(ROOT, "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8").replace(/\s*<url>\s*<loc>[^<]*<\/loc>\s*<lastmod>[^<]*<\/lastmod>\s*<changefreq>[^<]*<\/changefreq>\s*<priority>[^<]*<\/priority>\s*(<xhtml:link[^>]*\/>\s*)*<!-- seo-page --><\/url>/g, "");
if (!sm.includes("xmlns:xhtml")) sm = sm.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
const entries = PAGES.map((p) => {
  const alts = p.alt ? [[p.lang, p.slug], [p.lang === "bn" ? "en" : "bn", p.alt]].map(([l, s]) => `<xhtml:link rel="alternate" hreflang="${l}-IN" href="${SITE}/${s}/"/>`).join("\n") + "\n" : "";
  return `<url>\n<loc>${SITE}/${p.slug}/</loc>\n<lastmod>${UPDATED}T00:00:00.000Z</lastmod>\n<changefreq>monthly</changefreq>\n<priority>0.8</priority>\n${alts}<!-- seo-page --></url>`;
}).join("\n");
fs.writeFileSync(smPath, sm.replace("</urlset>", `${entries}\n</urlset>`));
console.log("sitemap updated:", (fs.readFileSync(smPath, "utf8").match(/<loc>/g) || []).length, "URLs");
