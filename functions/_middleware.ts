/**
 * Legacy Blogger URL migration.
 *
 * Redirect legacy Blogger hosts to the new Cloudflare Pages site while leaving
 * requests already on the canonical apex domain alone.
 *
 * After adding www.durgasaptashati.in and hindi.durgasaptashati.in as custom
 * domains to the same Cloudflare Pages project, this returns permanent (301)
 * redirects for mapped old Blogger paths.
 */
const LEGACY_HOSTS = new Set([
  "www.durgasaptashati.in",
  "hindi.durgasaptashati.in",
]);

const DESTINATIONS: Record<string, string> = {
  "/": "/",
  "/stotra.html": "/stotra.html",

  // Paths from hindi.durgasaptashati.in sitemap
  "/durga-saptashloki": "/chapter?id=durga-saptashloki",
  "/durga-ashtottara-shatanama-stotram-1": "/chapter?id=durga-ashtottara-shatanama-stotram",
  "/path-vidhi-1": "/chapter?id=path-vidhi",
  "/devi-kavacham": "/chapter?id=devi-kavacham",
  "/argala-stotram": "/chapter?id=argala-stotram",
  "/keelakam": "/chapter?id=keelakam",
  "/vedokta-ratri-suktam": "/chapter?id=vedokta-ratri-suktam",
  "/tantrokta-ratri-suktam": "/chapter?id=tantrokta-ratri-suktam",
  "/devi-atharvashirsha": "/chapter?id=devi-atharvashirsha",
  "/navarna-vidhi": "/chapter?id=navarna-vidhi",
  "/durga-saptashati-pratham-adhyay": "/chapter?id=durga-saptashati-pratham-adhyay",
  "/durga-saptashati-dwitiya-adhyay": "/chapter?id=durga-saptashati-dwitiya-adhyay",
  "/durga-saptashati-tritiya-adhyay": "/chapter?id=durga-saptashati-tritiya-adhyay",
  "/durga-saptashati-chaturtha-adhyay": "/chapter?id=durga-saptashati-chaturtha-adhyay",
  "/durga-saptashati-pancham-adhyay": "/chapter?id=durga-saptashati-pancham-adhyay",
  "/durga-saptashati-shashtho-adhyay": "/chapter?id=durga-saptashati-shashtho-adhyay",
  "/durga-saptashati-saptam-adhyay": "/chapter?id=durga-saptashati-saptam-adhyay",
  "/durga-saptashati-ashtam-adhyay": "/chapter?id=durga-saptashati-ashtam-adhyay",
  "/durga-saptashati-navam-adhyay": "/chapter?id=durga-saptashati-navam-adhyay",
  "/durga-saptashati-dasham-adhyay": "/chapter?id=durga-saptashati-dasham-adhyay",
  "/durga-saptashati-ekadash-adhyay": "/chapter?id=durga-saptashati-ekadash-adhyay",
  "/durga-saptashati-dwadash-adhyay": "/chapter?id=durga-saptashati-dwadash-adhyay",
  "/durga-saptashati-trayodash-adhyay": "/chapter?id=durga-saptashati-trayodash-adhyay",
  "/durga-saptashati-upasamhara": "/chapter?id=durga-saptashati-upasamhara",
  "/rigvedokta-devi-sukta": "/chapter?id=rigvedokta-devi-sukta",
  "/tantrokta-devi-suktam": "/chapter?id=tantrokta-devi-suktam",
  "/vaikritika-rahasyam": "/chapter?id=vaikritika-rahasyam",
  "/murti-rahasyam": "/chapter?id=murti-rahasyam",
  "/durga-kshama-prarthana": "/chapter?id=durga-kshama-prarthana",
  "/durga-manas-puja": "/chapter?id=durga-manas-puja",
  "/durga-dvatrimshat-namamala": "/chapter?id=durga-dvatrimshat-namamala",
  "/devi-aparadha-kshamapana-stotram": "/chapter?id=devi-aparadha-kshamapana-stotram",
  "/siddha-kunjika-stotram": "/chapter?id=siddha-kunjika-stotram",
  "/durga-saptashati-siddha-samput-mantra": "/chapter?id=durga-saptashati-siddha-samput-mantra",
  "/durga-devi-aarti": "/chapter?id=durga-devi-aarti",
  "/amba-ji-aarti": "/chapter?id=amba-ji-aarti",

  // Older dated Blogger URLs from the www.durgasaptashati.in sitemap
  "/2022/01/shridurgashtottrshatnamstotram.html": "/chapter?id=durga-ashtottara-shatanama-stotram",
  "/2022/01/shri-durga-saptshati-sampurn-path-vidhi.html": "/chapter?id=path-vidhi",
  "/2022/02/devi-kavach.html": "/chapter?id=devi-kavacham",
  "/2022/02/argla.html": "/chapter?id=argala-stotram",
  "/2022/02/kilkam.html": "/chapter?id=keelakam",
  "/2022/02/ratrisuktam.html": "/chapter?id=vedokta-ratri-suktam",
  "/2022/02/tantra-ratrisuktam.html": "/chapter?id=tantrokta-ratri-suktam",
  "/2022/02/devyarthshirsham.html": "/chapter?id=devi-atharvashirsha",
  "/2022/02/navarnvidhi.html": "/chapter?id=navarna-vidhi",
  "/2022/02/first-chapter.html": "/chapter?id=durga-saptashati-pratham-adhyay",
  "/2022/02/second-chapter.html": "/chapter?id=durga-saptashati-dwitiya-adhyay",
  "/2022/02/third-.html": "/chapter?id=durga-saptashati-tritiya-adhyay",
  "/2022/02/fourth-chapter.html": "/chapter?id=durga-saptashati-chaturtha-adhyay",
  "/2022/02/fifth-chapter.html": "/chapter?id=durga-saptashati-pancham-adhyay",
  "/2022/02/sixth-chapter.html": "/chapter?id=durga-saptashati-shashtho-adhyay",
  "/2022/02/seventh-chapter.html": "/chapter?id=durga-saptashati-saptam-adhyay",
  "/2022/02/eight.html": "/chapter?id=durga-saptashati-ashtam-adhyay",
  "/2022/02/ninth-.html": "/chapter?id=durga-saptashati-navam-adhyay",
  "/2022/02/tenth-chapter.html": "/chapter?id=durga-saptashati-dasham-adhyay",
  "/2022/02/eleventh-chapter .html": "/chapter?id=durga-saptashati-ekadash-adhyay",
  "/2022/02/twelveth-chapter.html": "/chapter?id=durga-saptashati-dwadash-adhyay",
  "/2022/02/thirteenth-chapter.html": "/chapter?id=durga-saptashati-trayodash-adhyay",
  "/2022/02/upanshar.html": "/chapter?id=durga-saptashati-upasamhara",
  "/2022/02/rigved-devisuktam.html": "/chapter?id=rigvedokta-devi-sukta",
  "/2022/02/tantra-devisuktam.html": "/chapter?id=tantrokta-devi-suktam",
  "/2022/02/waikritikan-rahsyam.html": "/chapter?id=vaikritika-rahasyam",
  "/2022/02/murti-rahasya.html": "/chapter?id=murti-rahasyam",
  "/2022/02/kshama-prarthna.html": "/chapter?id=durga-kshama-prarthana",
  "/2022/02/shri-durga-manas-puja.html": "/chapter?id=durga-manas-puja",
  "/2022/02/durga-dwatrinshnnammala.html": "/chapter?id=durga-dvatrimshat-namamala",
  "/2022/02/devyapradhkshamapanstotra.html": "/chapter?id=devi-aparadha-kshamapana-stotram",
  "/2022/02/siddhkunjika-stora.html": "/chapter?id=siddha-kunjika-stotram",
  "/2022/02/siddh-mantra.html": "/chapter?id=durga-saptashati-siddha-samput-mantra",
  "/2022/02/durga-aarti.html": "/chapter?id=durga-devi-aarti",
  "/2022/02/ambika-aarti.html": "/chapter?id=amba-ji-aarti",
};

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url);
  if (!LEGACY_HOSTS.has(url.hostname.toLowerCase())) return next();

  const destination = DESTINATIONS[url.pathname];
  if (!destination) return next();

  // Keep unrelated query parameters out of the destination; the new page ID is explicit.
  const target = new URL(destination, "https://durgasaptashati.in");
  return Response.redirect(target.toString(), 301);
};
