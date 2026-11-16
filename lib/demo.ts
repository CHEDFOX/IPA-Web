// Sample content for trying the site out without a backend. Switched on with NEXT_PUBLIC_DEMO=1
// (see .env.example); lib/api.ts then serves these listings instead of calling the backend, and
// the enquiry form confirms without sending anything.
//
// The photos in public/demo are CC0 / public domain — see public/demo/CREDITS.txt. Coordinates are
// real places in Telangana, so the map, Google Earth and directions buttons all work.

import type { Cover, ImageMedia, Property, PropertyCard, Site, VideoMedia } from './types';

// IPA_DEMO is read at run time; NEXT_PUBLIC_DEMO is baked in at build time.
export const DEMO = process.env.IPA_DEMO === '1' || process.env.NEXT_PUBLIC_DEMO === '1';

/** Widths generated for each photo by the build script, in order. */
type Widths = readonly number[];

const RATIO = 3 / 2;

function imageSet(dir: string, name: string, widths: Widths, ratio = RATIO) {
  return {
    sizes: widths.map((width) => ({ url: `/demo/${dir}/${name}-${width}.webp`, width, height: Math.round(width / ratio) })),
    og: `/demo/${dir}/${name}-og.webp`,
  };
}

let nextId = 100;

function photo(dir: string, name: string, widths: Widths, alt: string, ratio = RATIO): ImageMedia {
  const set = imageSet(dir, name, widths, ratio);
  const largest = set.sizes[set.sizes.length - 1];
  return { id: nextId++, kind: 'image', alt, width: largest.width, height: largest.height, ...set };
}

function cover(image: ImageMedia): Cover {
  return { sizes: image.sizes, og: image.og, alt: image.alt, width: image.width, height: image.height };
}

const W = {
  small: [640, 864],
  medium: [640, 960],
  large: [640, 1024],
  full: [640, 1280, 1920],
} as const;

// ---------- photos

const heroImage = photo('hero', 'hero', W.full, 'Farmland and low hills near Palampet, Telangana', 16 / 9);

const palampet = [
  photo('green-acres-palampet', '1', W.full, 'Green fields and low hills at the edge of the plot'),
  photo('green-acres-palampet', '2', W.medium, 'Aerial view of irrigated farm plots'),
  photo('green-acres-palampet', '3', W.full, 'The approach road running past the plot'),
  photo('green-acres-palampet', '4', W.full, 'Sunrise over paddy fields and palm trees'),
  photo('green-acres-palampet', '5', W.medium, 'Aerial view of cultivated fields and tracks'),
];

const palampetPlan = photo('green-acres-palampet', 'plan', [640, 1280, 1800], 'Site plan of Green Acres, Palampet', 3 / 2);

const palampetVideo: VideoMedia = {
  id: nextId++,
  kind: 'video',
  alt: 'Short walk-through of the land',
  url: '/demo/green-acres-palampet/tour.mp4',
  mime: 'video/mp4',
  width: 1280,
  height: 720,
  duration: 9,
  poster: imageSet('green-acres-palampet', '1', W.full),
};

const warangal = [
  photo('highway-plot-warangal', '1', W.medium, 'Aerial view of the land and the fields around it'),
  photo('highway-plot-warangal', '2', W.full, 'The state highway along the front boundary'),
  photo('highway-plot-warangal', '3', W.medium, 'Irrigated plots next to the site'),
];

const shamshabad = [
  photo('orchard-plot-shamshabad', '1', W.full, 'Palm trees and fields at first light'),
  photo('orchard-plot-shamshabad', '2', W.small, 'Harvest-ready field'),
];

const villa = [
  photo('villa-gachibowli', '1', W.large, 'Front elevation of the villa from the garden'),
  photo('villa-gachibowli', '2', W.medium, 'Pool and terrace at the rear of the house'),
  photo('villa-gachibowli', '3', W.large, 'Side elevation and driveway'),
  photo('villa-gachibowli', '4', W.large, 'Double-height living room'),
  photo('villa-gachibowli', '5', W.large, 'Kitchen with island and breakfast counter'),
  photo('villa-gachibowli', '6', W.large, 'Main bathroom'),
];

const deogarh = [
  photo('lakeside-deogarh', '1', W.full, 'Evening over the fields, with the Aravalli ridge behind'),
  photo('lakeside-deogarh', '2', W.full, 'Standing crop on the plot, rocky hillside beyond'),
  photo('lakeside-deogarh', '3', [640, 1280, 1618], 'Mustard in flower on the neighbouring plots'),
];

const office = [
  photo('office-floor-hitec-city', '1', W.large, 'The building from the street'),
  photo('office-floor-hitec-city', '2', W.large, 'Glass facade and entrance'),
  photo('office-floor-hitec-city', '3', W.medium, 'Open plan floor, handed over fitted'),
  photo('office-floor-hitec-city', '4', W.medium, 'Meeting room along the window line'),
  photo('office-floor-hitec-city', '5', W.medium, 'Breakout area'),
];

// ---------- listings

const DEMO_PROPERTIES: Property[] = [
  {
    id: 1,
    slug: 'green-acres-palampet',
    title: 'Green Acres — 2.4 ha beside the canal',
    titleHi: 'ग्रीन एकर्स — नहर किनारे 2.4 हेक्टेयर',
    type: 'land',
    status: 'available',
    visibility: 'public',
    featured: true,
    price: 14_500_000,
    priceNote: 'Negotiable, part payment accepted',
    location: 'Palampet',
    locationHi: 'पालमपेट',
    area: 2.4,
    areaUnit: 'ha',
    bedrooms: null,
    bathrooms: null,
    summary: 'Level farmland in two plots with canal water on the north boundary and a 9 m approach road at the front.',
    summaryHi: 'दो हिस्सों में समतल खेती की ज़मीन, उत्तर में नहर का पानी और सामने 9 मीटर चौड़ा रास्ता।',
    address: 'Survey no. 142/2, Palampet, Mulugu district, Telangana',
    addressHi: 'सर्वे नं. 142/2, पालमपेट, मुलुगु ज़िला, तेलंगाना',
    latitude: 18.2606,
    longitude: 79.9324,
    description:
      'Two adjoining plots of level, red-soil farmland, fenced on three sides and in cultivation today.\n\nThe canal runs along the whole northern boundary, so irrigation is year round; a borewell at the south-west corner is already fitted with a 5 HP pump. The 9 m approach road joins the Ramappa temple road 600 m away, which keeps the plot reachable by lorry in every season.\n\nClear title, single owner, Dharani passbook available. The plot can be bought whole or as either half.',
    descriptionHi:
      'दो सटे हुए समतल, लाल मिट्टी वाले खेत, तीन ओर से घेरे हुए और अभी भी खेती में।\n\nपूरी उत्तरी सीमा के साथ नहर बहती है, इसलिए सालभर सिंचाई होती है; दक्षिण-पश्चिम कोने पर बोरवेल में 5 HP पंप लगा हुआ है। 9 मीटर चौड़ा रास्ता 600 मीटर दूर रामप्पा मंदिर रोड से जुड़ता है, जिससे हर मौसम में ट्रक आ-जा सकता है।\n\nसाफ़ टाइटल, एक ही मालिक, धरणी पासबुक उपलब्ध। पूरी ज़मीन या कोई भी आधा हिस्सा लिया जा सकता है।',
    details: [
      { label: 'Survey number', value: '142/2', labelHi: 'सर्वे नंबर', valueHi: '142/2', key: true },
      { label: 'Soil', value: 'Red loam, level', labelHi: 'मिट्टी', valueHi: 'लाल दोमट, समतल', key: true },
      { label: 'Water', value: 'Canal + borewell (5 HP)', labelHi: 'पानी', valueHi: 'नहर + बोरवेल (5 HP)', key: true },
      { label: 'Road frontage', value: '9 m approach road', labelHi: 'रोड फ्रंटेज', valueHi: '9 मीटर रास्ता', key: false },
      { label: 'Fencing', value: 'Barbed wire on three sides', labelHi: 'बाड़', valueHi: 'तीन ओर कँटीले तार', key: false },
      { label: 'Electricity', value: 'Agricultural connection on site', labelHi: 'बिजली', valueHi: 'खेती का कनेक्शन मौजूद', key: false },
      { label: 'Title', value: 'Clear, single owner, Dharani passbook', labelHi: 'टाइटल', valueHi: 'साफ़, एक मालिक, धरणी पासबुक', key: false },
    ],
    nearby: [
      { place: 'Ramappa temple road', placeHi: 'रामप्पा मंदिर रोड', distance: '600 m' },
      { place: 'Palampet village', placeHi: 'पालमपेट गाँव', distance: '2.1 km' },
      { place: 'Mulugu town', placeHi: 'मुलुगु कस्बा', distance: '18 km' },
      { place: 'Warangal', placeHi: 'वारंगल', distance: '64 km' },
    ],
    gallery: [palampet[0], palampetVideo, palampet[1], palampet[2], palampet[3], palampet[4]],
    plan: palampetPlan,
    brochure: null,
    cover: cover(palampet[0]),
    updatedAt: '2026-10-28T09:15:00.000Z',
    createdAt: '2026-08-02T11:00:00.000Z',
  },
  {
    id: 2,
    slug: 'villa-gachibowli',
    title: '4-bedroom villa with pool, Gachibowli',
    titleHi: 'गाचीबावली में पूल के साथ 4 बेडरूम विला',
    type: 'residential',
    status: 'available',
    visibility: 'public',
    featured: true,
    price: 42_000_000,
    priceNote: 'Furnished, ready to move in',
    location: 'Hyderabad',
    locationHi: 'हैदराबाद',
    area: 420,
    areaUnit: 'm2',
    bedrooms: 4,
    bathrooms: 4,
    summary: 'Corner villa in a gated lane, with a double-height living room, a fitted kitchen and a pool behind the house.',
    summaryHi: 'गेटेड लेन में कॉर्नर विला — ऊँची छत वाला लिविंग रूम, मॉड्यूलर किचन और घर के पीछे स्विमिंग पूल।',
    address: 'Lane 4, Golden Habitat, Gachibowli, Hyderabad',
    addressHi: 'लेन 4, गोल्डन हैबिटैट, गाचीबावली, हैदराबाद',
    latitude: 17.4401,
    longitude: 78.3489,
    description:
      'A corner plot of 320 sq yd with 420 m² built over two floors, finished in 2023 and lived in since.\n\nThe ground floor is one long room: living, dining and kitchen, opening onto the pool deck through sliding doors. Four bedrooms upstairs, each with its own bathroom and wardrobes; the main bedroom has a balcony over the garden.\n\nCovered parking for two cars, a 7.5 kW rooftop solar array and a borewell with a 10,000 litre sump. The lane is gated with security at the entrance.',
    descriptionHi:
      '320 गज का कॉर्नर प्लॉट, दो मंज़िलों में 420 वर्ग मीटर निर्माण, 2023 में पूरा हुआ और तब से इस्तेमाल में।\n\nग्राउंड फ़्लोर एक लंबा खुला हिस्सा है — लिविंग, डाइनिंग और किचन, जो स्लाइडिंग दरवाज़ों से पूल डेक में खुलता है। ऊपर चार बेडरूम, हर एक के साथ अपना बाथरूम और अलमारियाँ; मुख्य बेडरूम की बालकनी बगीचे की ओर है।\n\nदो कारों की ढकी पार्किंग, 7.5 kW रूफ़टॉप सोलर और 10,000 लीटर सम्प वाला बोरवेल। लेन गेटेड है और प्रवेश पर सुरक्षा है।',
    details: [
      { label: 'Plot size', value: '320 sq yd', labelHi: 'प्लॉट', valueHi: '320 गज', key: true },
      { label: 'Built-up area', value: '420 m² over 2 floors', labelHi: 'निर्मित क्षेत्र', valueHi: '420 वर्ग मी., 2 मंज़िल', key: true },
      { label: 'Facing', value: 'East', labelHi: 'दिशा', valueHi: 'पूर्व', key: true },
      { label: 'Parking', value: 'Covered, 2 cars', labelHi: 'पार्किंग', valueHi: 'ढकी, 2 कार', key: false },
      { label: 'Power backup', value: '7.5 kW solar + inverter', labelHi: 'बिजली बैकअप', valueHi: '7.5 kW सोलर + इन्वर्टर', key: false },
      { label: 'Water', value: 'Corporation + borewell, 10,000 l sump', labelHi: 'पानी', valueHi: 'नगर निगम + बोरवेल, 10,000 ली. सम्प', key: false },
      { label: 'Completed', value: '2023', labelHi: 'निर्माण पूरा', valueHi: '2023', key: false },
    ],
    nearby: [
      { place: 'DLF Cyber City', placeHi: 'डीएलएफ साइबर सिटी', distance: '3.4 km' },
      { place: 'Outer Ring Road', placeHi: 'आउटर रिंग रोड', distance: '2.0 km' },
      { place: 'International school', placeHi: 'इंटरनेशनल स्कूल', distance: '1.2 km' },
      { place: 'Hospital', placeHi: 'अस्पताल', distance: '2.8 km' },
    ],
    gallery: villa,
    plan: null,
    brochure: null,
    cover: cover(villa[0]),
    updatedAt: '2026-11-04T07:40:00.000Z',
    createdAt: '2026-09-19T06:30:00.000Z',
  },
  {
    id: 3,
    slug: 'office-floor-hitec-city',
    title: 'Fitted office floor, HITEC City',
    titleHi: 'हाइटेक सिटी में तैयार ऑफ़िस फ़्लोर',
    type: 'commercial',
    status: 'available',
    visibility: 'public',
    featured: false,
    price: 68_000_000,
    priceNote: 'Leased to a tenant until 2028',
    location: 'Hyderabad',
    locationHi: 'हैदराबाद',
    area: 7400,
    areaUnit: 'sqft',
    bedrooms: null,
    bathrooms: null,
    summary: 'Whole fourth floor in a glass-fronted building, handed over fitted with 96 workstations and four meeting rooms.',
    summaryHi: 'शीशे के अग्रभाग वाली इमारत की पूरी चौथी मंज़िल — 96 वर्कस्टेशन और चार मीटिंग रूम के साथ तैयार।',
    address: 'Pinnacle Square, Hitech City Main Road, Hyderabad',
    addressHi: 'पिनेकल स्क्वायर, हाइटेक सिटी मेन रोड, हैदराबाद',
    latitude: 17.4474,
    longitude: 78.3762,
    description:
      'A whole floor of 7,400 sq ft, let to a software company on a lease running to March 2028 at ₹92 per sq ft a month.\n\nHanded over fitted: 96 workstations, four meeting rooms along the window line, a pantry and a breakout area. Two lifts plus a service lift, 100% DG backup and 24 reserved parking bays in the basement.\n\nSold with the lease in place, so the rent starts the month you buy.',
    descriptionHi:
      '7,400 वर्ग फुट की पूरी मंज़िल, एक सॉफ़्टवेयर कंपनी को मार्च 2028 तक ₹92 प्रति वर्ग फुट प्रति माह पर किराये पर दी हुई।\n\nपूरी तरह तैयार: 96 वर्कस्टेशन, खिड़की की ओर चार मीटिंग रूम, पैंट्री और ब्रेकआउट एरिया। दो लिफ्ट और एक सर्विस लिफ्ट, 100% डीजी बैकअप और बेसमेंट में 24 आरक्षित पार्किंग।\n\nकिरायेदारी समेत बिक रही है, इसलिए किराया खरीद के महीने से ही शुरू।',
    details: [
      { label: 'Floor', value: '4th, whole floor', labelHi: 'मंज़िल', valueHi: 'चौथी, पूरी मंज़िल', key: true },
      { label: 'Carpet area', value: '7,400 sq ft', labelHi: 'कारपेट एरिया', valueHi: '7,400 वर्ग फुट', key: true },
      { label: 'Current rent', value: '₹92 / sq ft / month', labelHi: 'मौजूदा किराया', valueHi: '₹92 / वर्ग फुट / माह', key: true },
      { label: 'Lease ends', value: 'March 2028', labelHi: 'लीज़ समाप्ति', valueHi: 'मार्च 2028', key: false },
      { label: 'Workstations', value: '96, fitted', labelHi: 'वर्कस्टेशन', valueHi: '96, लगे हुए', key: false },
      { label: 'Parking', value: '24 reserved bays', labelHi: 'पार्किंग', valueHi: '24 आरक्षित जगह', key: false },
      { label: 'Power backup', value: '100% DG', labelHi: 'बिजली बैकअप', valueHi: '100% डीजी', key: false },
    ],
    nearby: [
      { place: 'Raidurg metro station', placeHi: 'रायदुर्ग मेट्रो स्टेशन', distance: '1.1 km' },
      { place: 'Outer Ring Road', placeHi: 'आउटर रिंग रोड', distance: '4.0 km' },
      { place: 'Airport', placeHi: 'एयरपोर्ट', distance: '32 km' },
    ],
    gallery: office,
    plan: null,
    brochure: null,
    cover: cover(office[0]),
    updatedAt: '2026-11-11T12:05:00.000Z',
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 4,
    slug: 'highway-plot-warangal',
    title: 'Highway-facing plot, 1.6 ha',
    titleHi: 'हाईवे पर 1.6 हेक्टेयर प्लॉट',
    type: 'land',
    status: 'under_offer',
    visibility: 'public',
    featured: false,
    price: 9_200_000,
    priceNote: '',
    location: 'Warangal',
    locationHi: 'वारंगल',
    area: 1.6,
    areaUnit: 'ha',
    bedrooms: null,
    bathrooms: null,
    summary: '112 m of frontage on the state highway, suitable for a warehouse, a petrol pump or a roadside development.',
    summaryHi: 'स्टेट हाईवे पर 112 मीटर फ्रंटेज — गोदाम, पेट्रोल पंप या रोडसाइड निर्माण के लिए उपयुक्त।',
    address: 'Near Dharmasagar, State Highway 1, Warangal district, Telangana',
    addressHi: 'धर्मसागर के पास, स्टेट हाईवे 1, वारंगल ज़िला, तेलंगाना',
    latitude: 17.9784,
    longitude: 79.5941,
    description:
      'A rectangular plot with 112 m directly on the state highway and a depth of 143 m, currently under crop.\n\nThe land is flat and needs no levelling. Three-phase power runs along the road and the district water line is 400 m away. Conversion to non-agricultural use has been applied for; papers can be shown on request.\n\nAn offer has been accepted on this plot. Ask us to be told if it comes back on the market.',
    descriptionHi:
      'आयताकार प्लॉट — स्टेट हाईवे पर सीधे 112 मीटर और गहराई 143 मीटर, अभी फ़सल में।\n\nज़मीन समतल है, लेवलिंग की ज़रूरत नहीं। सड़क के साथ थ्री-फ़ेज़ बिजली है और ज़िला जल लाइन 400 मीटर दूर। गैर-कृषि उपयोग में बदलने के लिए आवेदन किया जा चुका है; कागज़ात माँगने पर दिखाए जा सकते हैं।\n\nइस प्लॉट पर एक सौदा स्वीकार हो चुका है। दोबारा उपलब्ध होने पर जानकारी के लिए हमें बताएँ।',
    details: [
      { label: 'Highway frontage', value: '112 m', labelHi: 'हाईवे फ्रंटेज', valueHi: '112 मीटर', key: true },
      { label: 'Depth', value: '143 m', labelHi: 'गहराई', valueHi: '143 मीटर', key: true },
      { label: 'Use', value: 'NA conversion applied for', labelHi: 'उपयोग', valueHi: 'एनए रूपांतरण के लिए आवेदन', key: true },
      { label: 'Power', value: 'Three-phase along the road', labelHi: 'बिजली', valueHi: 'सड़क के साथ थ्री-फ़ेज़', key: false },
      { label: 'Water', value: 'District line 400 m away', labelHi: 'पानी', valueHi: 'ज़िला लाइन 400 मीटर दूर', key: false },
    ],
    nearby: [
      { place: 'Dharmasagar', placeHi: 'धर्मसागर', distance: '3.2 km' },
      { place: 'Warangal city', placeHi: 'वारंगल शहर', distance: '16 km' },
      { place: 'Kazipet railway station', placeHi: 'काज़ीपेट रेलवे स्टेशन', distance: '12 km' },
    ],
    gallery: warangal,
    plan: null,
    brochure: null,
    cover: cover(warangal[0]),
    updatedAt: '2026-11-09T05:20:00.000Z',
    createdAt: '2026-07-14T10:10:00.000Z',
  },
  {
    id: 6,
    slug: 'lakeside-deogarh',
    title: 'Lakeside farmland, Deogarh',
    titleHi: 'देवगढ़ में झील किनारे खेती की ज़मीन',
    type: 'land',
    status: 'available',
    visibility: 'public',
    featured: true,
    price: 11_800_000,
    priceNote: 'Per bigha rate on request',
    location: 'Deogarh',
    locationHi: 'देवगढ़',
    area: 3.1,
    areaUnit: 'ha',
    bedrooms: null,
    bathrooms: null,
    summary:
      'Open farmland on the Sangrampura road, 300 m from the lake and two kilometres north of Deogarh town, with the Aravalli ridge on the skyline.',
    summaryHi:
      'संग्रामपुरा रोड पर खुली खेती की ज़मीन — झील से 300 मीटर और देवगढ़ कस्बे से दो किलोमीटर उत्तर, क्षितिज पर अरावली की पहाड़ियाँ।',
    address: 'Sangrampura, Deogarh tehsil, Rajsamand district, Rajasthan 313331',
    addressHi: 'संग्रामपुरा, देवगढ़ तहसील, राजसमंद ज़िला, राजस्थान 313331',
    latitude: 25.5429104,
    longitude: 73.917688,
    description:
      'Three and a bit hectares of level cultivated land on the metalled road that runs north from Deogarh to Sangrampura, in a belt of working farm plots between the town and the lake.\n\nThe water body lies about 300 m east, so the water table here is kinder than on the higher ground west of the road; the plot is under crop today and has an open well in the north-east corner. The Aravalli ridge closes the view on three sides.\n\nDeogarh town, with its school, bank and hospital, is two kilometres south, and the state highway through the town carries on to Bhim and to Rajsamand.',
    descriptionHi:
      'देवगढ़ से संग्रामपुरा जाने वाली पक्की सड़क पर तीन हेक्टेयर से कुछ अधिक समतल खेती की ज़मीन — कस्बे और झील के बीच खेतों की पट्टी में।\n\nपानी लगभग 300 मीटर पूर्व में है, इसलिए यहाँ जलस्तर सड़क के पश्चिम की ऊँची ज़मीन से बेहतर है; प्लॉट अभी फ़सल में है और उत्तर-पूर्व कोने पर खुला कुआँ है। तीन ओर अरावली की पहाड़ियाँ दिखती हैं।\n\nदेवगढ़ कस्बा — स्कूल, बैंक और अस्पताल के साथ — दो किलोमीटर दक्षिण में है, और कस्बे से गुज़रता स्टेट हाईवे भीम और राजसमंद तक जाता है।',
    details: [
      { label: 'Road', value: 'Metalled village road at the front', labelHi: 'सड़क', valueHi: 'सामने पक्की गाँव सड़क', key: true },
      { label: 'Water', value: 'Open well; lake 300 m east', labelHi: 'पानी', valueHi: 'खुला कुआँ; झील 300 मीटर पूर्व', key: true },
      { label: 'Terrain', value: 'Level, under crop', labelHi: 'ज़मीन', valueHi: 'समतल, फ़सल में', key: true },
      { label: 'Tehsil', value: 'Deogarh, Rajsamand district', labelHi: 'तहसील', valueHi: 'देवगढ़, राजसमंद ज़िला', key: false },
      { label: 'Electricity', value: 'Line along the road', labelHi: 'बिजली', valueHi: 'सड़क के साथ लाइन', key: false },
    ],
    nearby: [
      { place: 'Lake', placeHi: 'झील', distance: '300 m' },
      { place: 'Sangrampura', placeHi: 'संग्रामपुरा', distance: '700 m' },
      { place: 'Deogarh town', placeHi: 'देवगढ़ कस्बा', distance: '2 km' },
      { place: 'Hospital', placeHi: 'अस्पताल', distance: '1.2 km' },
    ],
    gallery: deogarh,
    plan: null,
    brochure: null,
    cover: cover(deogarh[0]),
    updatedAt: '2026-11-14T10:30:00.000Z',
    createdAt: '2026-11-14T10:30:00.000Z',
  },
  {
    id: 5,
    slug: 'orchard-plot-shamshabad',
    title: 'Orchard plot near Shamshabad',
    titleHi: 'शमशाबाद के पास बाग़ वाला प्लॉट',
    type: 'land',
    status: 'sold',
    visibility: 'public',
    featured: false,
    price: 6_800_000,
    priceNote: 'Sold in October 2026',
    location: 'Shamshabad',
    locationHi: 'शमशाबाद',
    area: 1.1,
    areaUnit: 'ha',
    bedrooms: null,
    bathrooms: null,
    summary: 'A mango orchard of 70 grown trees with a bore and a watchman’s room. Sold — kept here for reference.',
    summaryHi: '70 बड़े आम के पेड़ों का बाग़, बोरवेल और चौकीदार के कमरे के साथ। बिक चुकी — जानकारी के लिए रखी गई है।',
    address: 'Kothwalguda, Shamshabad mandal, Ranga Reddy district',
    addressHi: 'कोथवालगुडा, शमशाबाद मंडल, रंगा रेड्डी ज़िला',
    latitude: 17.2403,
    longitude: 78.4294,
    description:
      'A planted mango orchard of 1.1 ha, 70 trees in full bearing, with a borewell, drip lines and a one-room shelter at the gate.\n\nThis plot was sold in October 2026. Similar orchard land comes up in the same belt two or three times a year — message us and we will tell you when it does.',
    descriptionHi:
      '1.1 हेक्टेयर का आम का बाग़, 70 पेड़ पूरी पैदावार में, बोरवेल, ड्रिप लाइन और गेट पर एक कमरे का शेड।\n\nयह प्लॉट अक्टूबर 2026 में बिक गया। इसी इलाक़े में ऐसी बाग़ वाली ज़मीन साल में दो-तीन बार आती है — हमें संदेश करें, आने पर बता देंगे।',
    details: [
      { label: 'Trees', value: '70 mango, in bearing', labelHi: 'पेड़', valueHi: '70 आम, फल देते हुए', key: true },
      { label: 'Water', value: 'Borewell with drip lines', labelHi: 'पानी', valueHi: 'बोरवेल और ड्रिप लाइन', key: true },
      { label: 'Structures', value: 'One-room shelter at the gate', labelHi: 'निर्माण', valueHi: 'गेट पर एक कमरे का शेड', key: false },
    ],
    nearby: [
      { place: 'Airport', placeHi: 'एयरपोर्ट', distance: '9 km' },
      { place: 'Outer Ring Road', placeHi: 'आउटर रिंग रोड', distance: '4.5 km' },
    ],
    gallery: shamshabad,
    plan: null,
    brochure: null,
    cover: cover(shamshabad[0]),
    updatedAt: '2026-10-20T08:00:00.000Z',
    createdAt: '2026-05-06T07:45:00.000Z',
  },
];

/** The private link shown on the demo site: /p/demo-preview. */
const DEMO_SHARED: Record<string, Property> = {
  'demo-preview': {
    ...DEMO_PROPERTIES[1],
    id: 6,
    slug: 'villa-gachibowli-preview',
    visibility: 'unlisted',
    title: 'Villa preview — not yet published',
    titleHi: 'विला प्रीव्यू — अभी प्रकाशित नहीं',
  },
};

const DEMO_SITE: Site = {
  settings: {
    siteName: 'IPA Demo',
    siteNameHi: 'IPA डेमो',
    tagline: 'Land & property, Telangana',
    taglineHi: 'ज़मीन और प्रॉपर्टी, तेलंगाना',
    heroTitle: 'Land you can walk before you buy.',
    heroTitleHi: 'ख़रीदने से पहले ज़मीन पर चलकर देखिए।',
    heroText:
      'Farmland, plots, homes and commercial space around Warangal, Hyderabad and Deogarh — photographed, measured and mapped, so you know what you are visiting.',
    heroTextHi:
      'वारंगल, हैदराबाद और देवगढ़ के आसपास खेती की ज़मीन, प्लॉट, मकान और कमर्शियल जगह — फ़ोटो, नाप और नक्शे के साथ, ताकि आपको पहले से पता हो कि आप क्या देखने जा रहे हैं।',
    aboutTitle: 'About IPA',
    aboutTitleHi: 'IPA के बारे में',
    aboutText:
      'This is a demo of the IPA website, filled with sample listings so you can click through every page without the backend running.\n\nThe photographs are public-domain pictures, the prices are made up and the phone number is not a real line. The map, Google Earth and directions buttons do point at real places in Telangana and Rajasthan.',
    aboutTextHi:
      'यह IPA वेबसाइट का डेमो है, जिसमें नमूना प्रॉपर्टी भरी हैं ताकि बैकएंड चलाए बिना हर पेज देखा जा सके।\n\nफ़ोटो सार्वजनिक डोमेन की हैं, कीमतें काल्पनिक हैं और फ़ोन नंबर असली लाइन नहीं है। नक्शा, गूगल अर्थ और दिशा-निर्देश बटन तेलंगाना और राजस्थान की असली जगहों पर ले जाते हैं।',
    contactTitle: 'Looking for something specific?',
    contactTitleHi: 'कुछ ख़ास ढूँढ रहे हैं?',
    contactText: 'Tell us the area, the size and the budget, and we will send what is available this week.',
    contactTextHi: 'हमें इलाक़ा, आकार और बजट बताइए — इस हफ़्ते जो उपलब्ध है वह भेज देंगे।',
    phone: '+91 90000 00000',
    whatsapp: '+91 90000 00000',
    email: 'demo@example.com',
    address: 'Demo office, MG Road, Warangal, Telangana',
    addressHi: 'डेमो ऑफ़िस, एमजी रोड, वारंगल, तेलंगाना',
    currency: 'INR',
    instagram: '',
    facebook: '',
    footerNote: 'Demo content — sample listings and public-domain photographs. Nothing here is for sale.',
    footerNoteHi: 'डेमो सामग्री — नमूना प्रॉपर्टी और सार्वजनिक डोमेन की तस्वीरें। यहाँ कुछ भी बिक्री के लिए नहीं है।',
  },
  hero: heroImage,
  portrait: null,
  locations: ['Deogarh', 'Hyderabad', 'Palampet', 'Shamshabad', 'Warangal'],
  regions: ['Deogarh', 'Hyderabad', 'Palampet', 'Shamshabad', 'Warangal'].map((name, i) => ({
    id: i + 1,
    slug: name.toLowerCase(),
    name,
  })),
  counts: {
    land: DEMO_PROPERTIES.filter((p) => p.type === 'land').length,
    residential: DEMO_PROPERTIES.filter((p) => p.type === 'residential').length,
    commercial: DEMO_PROPERTIES.filter((p) => p.type === 'commercial').length,
    total: DEMO_PROPERTIES.length,
  },
};

/** The listing as it appears in a grid: the card fields plus the photo and video counts. */
function toCard(p: Property): PropertyCard {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    titleHi: p.titleHi,
    type: p.type,
    status: p.status,
    visibility: p.visibility,
    featured: p.featured,
    price: p.price,
    priceNote: p.priceNote,
    location: p.location,
    locationHi: p.locationHi,
    area: p.area,
    areaUnit: p.areaUnit,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    summary: p.summary,
    summaryHi: p.summaryHi,
    updatedAt: p.updatedAt,
    cover: p.cover,
    photoCount: p.gallery.filter((g) => g.kind === 'image').length,
    videoCount: p.gallery.filter((g) => g.kind === 'video').length,
  };
}

export const demoSite = (): Site => DEMO_SITE;
export const demoListings = (): PropertyCard[] => DEMO_PROPERTIES.map(toCard);
export const demoProperty = (slug: string): Property | null => DEMO_PROPERTIES.find((p) => p.slug === slug) ?? null;
export const demoSharedProperty = (token: string): Property | null => DEMO_SHARED[token] ?? null;
