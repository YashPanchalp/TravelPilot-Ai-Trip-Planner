import axios from 'axios';

// Comprehensive city to airport code mapping - covers 500+ major global destinations
const CITY_TO_AIRPORT = {
  // Sri Lanka
  'sri lanka': 'CMB',
  'colombo': 'CMB',
  'kandy': 'CMB',
  'galle': 'CMB',
  'hambantota': 'HRI',
  'jaffna': 'JAF',
  'trincomalee': 'TRR',
  'batticaloa': 'BTC',
  'sigiriya': 'KCT',

  // USA - Major Cities
  'new york': 'JFK',
  'new york city': 'JFK',
  'los angeles': 'LAX',
  'chicago': 'ORD',
  'houston': 'IAH',
  'dallas': 'DFW',
  'austin': 'AUS',
  'miami': 'MIA',
  'denver': 'DEN',
  'seattle': 'SEA',
  'san francisco': 'SFO',
  'boston': 'BOS',
  'atlanta': 'ATL',
  'las vegas': 'LAS',
  'orlando': 'MCO',
  'phoenix': 'PHX',
  'philadelphia': 'PHL',
  'minneapolis': 'MSP',
  'detroit': 'DTW',
  'washington': 'DCA',
  'san diego': 'SAN',
  'portland': 'PDX',
  'honolulu': 'HNL',
  'anchorage': 'ANC',
  'salt lake city': 'SLC',
  'nashville': 'BNA',
  'memphis': 'MEM',
  'san antonio': 'SAT',
  'fort lauderdale': 'FLL',
  'tampa': 'TPA',
  'palm beach': 'PBI',
  'cabo san lucas': 'SJD',
  
  // Europe
  'paris': 'CDG',
  'london': 'LHR',
  'barcelona': 'BCN',
  'madrid': 'MAD',
  'amsterdam': 'AMS',
  'berlin': 'BER',
  'frankfurt': 'FRA',
  'rome': 'FCO',
  'milan': 'MXP',
  'lisbon': 'LIS',
  'zurich': 'ZRH',
  'geneva': 'GVA',
  'vienna': 'VIE',
  'prague': 'PRG',
  'budapest': 'BUD',
  'stockholm': 'ARN',
  'oslo': 'OSL',
  'dublin': 'DUB',
  'athens': 'ATH',
  'istanbul': 'IST',
  'venice': 'VCE',
  'munich': 'MUC',
  'cologne': 'CGN',
  'hamburg': 'HAM',
  'copenhagen': 'CPH',
  'brussels': 'BRU',
  'naples': 'NAP',
  'florence': 'FLR',
  'warsaw': 'WAW',
  'krakow': 'KRK',
  'bucharest': 'OTP',
  'sofia': 'SOF',
  'mykonos': 'JMY',
  'santorini': 'JTR',
  'rhodes': 'RHO',
  'crete': 'HER',
  'reykjavik': 'KEF',
  'lausanne': 'ZRH',
  'bern': 'BER',
  'lucerne': 'ZRH',
  'malaga': 'AGP',
  'seville': 'SVQ',
  'bilbao': 'BIO',
  'palma': 'PMI',
  'ibiza': 'IBZ',
  'nice': 'NCE',
  'marseille': 'MRS',
  'lyon': 'LYS',
  
  // Asia - South Asia
  'delhi': 'DEL',
  'mumbai': 'BOM',
  'bangalore': 'BLR',
  'hyderabad': 'HYD',
  'ahmedabad': 'AMD',
  'kolkata': 'CCU',
  'pune': 'PNQ',
  'chennai': 'MAA',
  'goa': 'GOI',
  'jaipur': 'JAI',
  'lucknow': 'LKO',
  'indore': 'IDR',
  'srinagar': 'SXR',
  'chandigarh': 'IXC',
  'amritsar': 'ATQ',
  'udaipur': 'UDR',
  'agra': 'AGR',
  'varanasi': 'VNS',
  'dhaka': 'DAC',
  'chittagong': 'CGP',
  'kathmandu': 'KTM',
  'islamabad': 'ISB',
  'karachi': 'KHI',
  'lahore': 'LHE',
  'peshawar': 'PEW',
  'multan': 'MUX',
  'faisalabad': 'LYP',
  'male': 'MLE',
  
  // Asia - Southeast Asia & East Asia
  'bangkok': 'BKK',
  'singapore': 'SIN',
  'hong kong': 'HKG',
  'tokyo': 'NRT',
  'osaka': 'KIX',
  'kyoto': 'KIX',
  'seoul': 'ICN',
  'kuala lumpur': 'KUL',
  'phuket': 'HKT',
  'bali': 'DPS',
  'jakarta': 'CGK',
  'surabaya': 'SUB',
  'chiang mai': 'CNX',
  'krabi': 'HKT',
  'patong': 'HKT',
  'pattaya': 'BKK',
  'koh samui': 'USM',
  'tokyo haneda': 'HND',
  'nagoya': 'NGO',
  'fukuoka': 'FUK',
  'busan': 'PUS',
  'shanghai': 'PVG',
  'beijing': 'PEI',
  'peking': 'PEI',
  'guangzhou': 'CAN',
  'chengdu': 'CTU',
  'chongqing': 'CKG',
  'hangzhou': 'HGH',
  'nanjing': 'NKG',
  'taipei': 'TPE',
  'macau': 'MFM',
  'yangon': 'RGN',
  'mandalay': 'MDL',
  'vientiane': 'VTE',
  'luang prabang': 'LPQ',
  'phnom penh': 'PNH',
  'siem reap': 'REP',
  'manila': 'MNL',
  'cebu': 'CEB',
  'davao': 'DVO',
  'iloilo': 'ILO',
  'bacolod': 'BCD',
  'palawan': 'PPS',
  'puerto princesa': 'PPS',
  
  // Vietnam - Major Cities and Destinations
  'ho chi minh city': 'SGN',
  'hanoi': 'HAN',
  'da nang': 'DAD',
  'phu quoc': 'PQC',
  'nha trang': 'NHA',
  'hai phong': 'HPH',
  'can tho': 'CAH',
  'hue': 'HUI',
  'vung tau': 'SGN',
  'phan thiet': 'SGN',
  'mui ne': 'SGN',
  'soc trang': 'CAH',
  'ca mau': 'CAH',
  'rach gia': 'SGN',
  'ha tien': 'SGN',
  'chau doc': 'CAH',
  'saigon': 'SGN',
  'ho chi minh': 'SGN',
  'hcmc': 'SGN',
  
  // Middle East
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  'doha': 'DOH',
  'riyadh': 'RYD',
  'beirut': 'BEY',
  'baghdad': 'BGW',
  'oman': 'MCT',
  'muscat': 'MCT',
  'tehran': 'IKA',
  'tel aviv': 'TLV',
  'jerusalem': 'QQE',
  'jeddah': 'JED',
  'mecca': 'JED',
  'medina': 'MED',
  'bahrain': 'BAH',
  'manama': 'BAH',
  'kuwait': 'KWI',
  'abudhabi': 'AUH',
  'sharjah': 'SHJ',
  'ras al khaimah': 'RKT',
  'fujairah': 'FJI',
  'umm al quwain': 'AUH',
  'ajman': 'AUH',
  'dead sea': 'JOR',
  'amman': 'AMM',
  'damascus': 'DAM',
  'aleppo': 'ALP',
  'aqaba': 'AQJ',
  'tyre': 'BEY',
  'sidon': 'BEY',
  'tripoli lebanon': 'BEY',
  'palmyra': 'PMS',
  
  // Africa
  'cairo': 'CAI',
  'johannesburg': 'JNB',
  'cape town': 'CPT',
  'lagos': 'LOS',
  'nairobi': 'NBO',
  'addis ababa': 'ADD',
  'marrakech': 'RAK',
  'casablanca': 'CMN',
  'accra': 'ACC',
  'tunis': 'TUN',
  'mauritius': 'MRU',
  'durban': 'DUR',
  'pretoria': 'JNB',
  'bloemfontein': 'BFN',
  'port elizabeth': 'PLZ',
  'east london': 'ELS',
  'maputo': 'MPM',
  'harare': 'HRE',
  'lusaka': 'LUN',
  'dar es salaam': 'DAR',
  'zanzibar': 'ZNZ',
  'kampala': 'EBB',
  'kigali': 'KGL',
  'bujumbura': 'BJM',
  'kinshasa': 'FIH',
  'brazzaville': 'BZV',
  'douala': 'DLA',
  'yaoundé': 'NSI',
  'kumasi': 'KMS',
  'abidjan': 'ABJ',
  'yamoussoukro': 'ABJ',
  'dakar': 'DSS',
  'bamako': 'BKO',
  'ouagadougou': 'OUA',
  'niamey': 'NIM',
  'port louis': 'MRU',
  'victoria': 'SEZ',
  'khartoum': 'KRT',
  'aswan': 'ASW',
  'luxor': 'LXR',
  'giza': 'CAI',
  'alexandria': 'ALY',
  'fez': 'FEZ',
  'fes': 'FEZ',
  'tangier': 'TNG',
  'agadir': 'AGA',
  'essaouira': 'ESU',
  'el aaiun': 'EUN',
  'dakhla': 'VIZ',
  
  // Americas - Canada & Mexico & Central America
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  'calgary': 'YYC',
  'mexico city': 'MEX',
  'cancun': 'CUN',
  'playa del carmen': 'CUN',
  'puerto vallarta': 'PVR',
  'san juan': 'SJU',
  'panama city': 'PTY',
  'costa rica': 'SJO',
  'belize': 'BZE',
  'belize city': 'BZE',
  'san salvador': 'SAL',
  'tegucigalpa': 'TGU',
  'managua': 'MGA',
  'leon': 'MGA',
  'granada': 'MGA',
  'guatemala city': 'LAG',
  'antigua guatemala': 'LAG',
  'chichicastenango': 'LAG',
  'lake atitlan': 'LAG',
  'belmopan': 'BZE',
  'cozumel': 'CZM',
  'isla mujeres': 'CUN',
  'tulum': 'CUN',
  'merida': 'MID',
  'oaxaca': 'OAX',
  'mazatlan': 'MZT',
  'ixtapa': 'ZIH',
  'zihuatanejo': 'ZIH',
  'acapulco': 'ACA',
  'huatulco': 'HUX',
  'toluca': 'TLC',
  'monterrey': 'MTY',
  'monterey': 'MTY',
  'nuevo laredo': 'NLD',
  'saltillo': 'SLW',
  'durango': 'DGO',
  'chihuahua': 'CJS',
  'juarez': 'CJS',
  'el paso': 'ELP',
  'hermosillo': 'HMO',
  'guaymas': 'GYM',
  'los mochis': 'LMM',
  'culiacan': 'CUL',
  'la paz': 'LAP',
  'los cabos': 'SJD',
  'cabo': 'SJD',
  'san jose del cabo': 'SJD',
  'mulege': 'LAP',
  'loreto': 'LTO',
  
  // South America
  'buenos aires': 'AEP',
  'sao paulo': 'GIG',
  'rio de janeiro': 'SDU',
  'lima': 'LIM',
  'bogota': 'BOG',
  'cartagena': 'CTG',
  'santiago': 'SCL',
  'quito': 'UIO',
  'caracas': 'CCS',
  'georgetown': 'GEO',
  'paramaribo': 'PBM',
  'cayenne': 'CYN',
  'recife': 'REC',
  'salvador': 'SSA',
  'fortaleza': 'FOR',
  'manaus': 'MAO',
  'belem': 'BEL',
  'sao luis': 'SLZ',
  'natal': 'NAT',
  'joao pessoa': 'JPA',
  'maceio': 'MCZ',
  'aracaju': 'AJU',
  'porto seguro': 'BPS',
  'ilheus': 'ILH',
  'vitoria': 'VIX',
  'santos': 'CGH',
  'curitiba': 'CWB',
  'brasilia': 'BSB',
  'goiania': 'GYN',
  'belo horizonte': 'CNF',
  'porto alegre': 'POA',
  'florianopolis': 'FLN',
  'sucre': 'SRE',
  'asuncion': 'ASU',
  'montevideo': 'MVD',
  'punta del este': 'MVD',
  'mendoza': 'MDZ',
  'cordoba': 'COR',
  'rosario': 'ROS',
  'salta': 'SLA',
  'bariloche': 'BRC',
  'iguazu': 'IGR',
  'arequipa': 'AQT',
  'cusco': 'CUZ',
  'machu picchu': 'CUZ',
  'trujillo': 'TRU',
  'puno': 'PEM',
  'iquitos': 'IQI',
  'puerto maldonado': 'PEM',
  'ayacucho': 'AYA',
  'huancayo': 'HYO',
  'tarapoto': 'SPE',
  'yurimaguas': 'YMS',
  'chimbote': 'CHM',
  'guayaquil': 'GYE',
  'cuenca': 'CUE',
  'baños': 'BAF',
  'ibarra': 'IBR',
  'esmeraldas': 'ESM',
  'manta': 'MEC',
  'puerto ayora': 'GPS',
  'galapagos': 'GPS',
  'santa cruz': 'GPS',
  'islas galapagos': 'GPS',
  'cali': 'CLO',
  'medellin': 'MDE',
  'barranquilla': 'BAQ',
  'santa marta': 'SMR',
  'riohacha': 'RIH',
  'arauca': 'AUA',
  'yopal': 'YOP',
  'pasto': 'PSO',
  'ipiales': 'IPL',
  'cucuta': 'CUC',
  'bucaramanga': 'BGA',
  'sora': 'BGA',
  'manizales': 'MZL',
  'armenia': 'ARM',
  'pereira': 'PEI',
  'ibague': 'IBE',
  'neiva': 'NVA',
  'florencia': 'FLA',
  'leticia': 'LET',
  'puerto careno': 'CRC',
  'trinidad': 'CRC',
  'maracacuya': 'MAR',
  'orinoquía': 'VID',
  'puerto lopez': 'PVL',
  'villavicencio': 'VID',
  'puerto inirida': 'PII',
  'puerto guaviare': 'PVG',
  'maracaibo': 'MAR',
  'valencia': 'VLN',
  'barquisimeto': 'BRM',
  'cumana': 'CUM',
  'puerto la cruz': 'PLC',
  'margarita': 'PMV',
  'araya': 'ARY',
  'coro': 'COR',
  'punto fijo': 'PF',
  'barinas': 'BRA',
  'turén': 'TUR',
  'calabozo': 'CBZ',
  'guanare': 'GAN',
  'acarigua': 'ACA',
  'ospino': 'OSP',
  'guanaguanare': 'GNG',
  'el sombrero': 'ELS',
  'ciudad bolivar': 'CBL',
  'puerto ordaz': 'PZO',
  'upata': 'UPA',
  'tumeremo': 'TMO',
  'guasipati': 'GUS',
  'ciudad guayana': 'PZO',
  'tucupita': 'TCI',
  'rio caribe': 'RCA',
  'margarita island': 'PMV',
  
  // Oceania
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',
  'brisbane': 'BNE',
  'perth': 'PER',
  'fiji': 'SUV',
  'samoa': 'APW',
  'darwin': 'DRW',
  'hobart': 'HBA',
  'cairns': 'CNS',
  'gold coast': 'OOL',
  'sunshine coast': 'MCY',
  'newcastle': 'NTL',
  'canberra': 'CBR',
  'adelaide': 'ADL',
  'townsville': 'TSV',
  'rockhampton': 'ROK',
  'bundaberg': 'BDB',
  'gladstone': 'GLT',
  'mackay': 'MKY',
  'proserpine': 'PPP',
  'bowen': 'BWT',
  'airlie beach': 'PPP',
  'whitehaven': 'PPP',
  'whitsunday': 'PPP',
  'hamilton island': 'HIS',
  'daydream island': 'HIS',
  'south molle island': 'HIS',
  'long island': 'HIS',
  'magnetic island': 'TSV',
  'great barrier reef': 'CNS',
  'lady elliot island': 'BDB',
  'lady musgrave island': 'GLT',
  'heron island': 'GLT',
  'wilson island': 'GLT',
  'wellington': 'WLG',
  'christchurch': 'CHC',
  'queenstown': 'ZQN',
  'dunedin': 'DUD',
  'hamilton': 'HLZ',
  'tauranga': 'TRG',
  'rotorua': 'ROT',
  'taupo': 'TUO',
  'napier': 'NPE',
  'new plymouth': 'NPL',
  'palmerston north': 'PMR',
  'whangarei': 'WRE',
  'invercargill': 'IVC',
  'greymouth': 'GMN',
  'timaru': 'TMU',
  'oamaru': 'OAM',
  'westport': 'WSZ',
  'nelson': 'NSN',
  'blenheim': 'BHE',
  'picton': 'PCN',
  'kaikoura': 'KKK',
  'porirua': 'WLG',
  'hutt valley': 'WLG',
  'kapiti': 'WLG',
  'wairarapa': 'WLG',
  'manawatu': 'PMR',
  'rangitikei': 'PMR',
  'taranaki': 'NPL',
  'waikato': 'HLZ',
  'waitomo': 'HLZ',
  'bay of plenty': 'TRG',
  'gisborne': 'GIZ',
  'hawkes bay': 'NPE',
  'tairawhiti': 'GIZ',
  'east cape': 'GIZ',
  'north island': 'AKL',
  'south island': 'CHC',
  'fiji islands': 'SUV',
  'viti levu': 'SUV',
  'vanua levu': 'SUV',
  'samoa islands': 'APW',
  'upolu': 'APW',
  'savaii': 'APW',
  'tonga islands': 'NAN',
  'tongatapu': 'NAN',
  'vavau': 'VAV',
  'eua': 'EUA',
  'ha apai': 'LIU',
  'vanuatu islands': 'VLI',
  'espiritu santo': 'SFJ',
  'efate': 'VLI',
  'solomon islands': 'HIR',
  'guadalcanal': 'HIR',
  'honiara': 'HIR',
  'malaita': 'MAL',
  'western province': 'GIZ',
  'choiseul': 'CHO',
  'isabel': 'IZA',
  'florida islands': 'HIR',
  'nggela islands': 'HIR',
  'rennel': 'RNL',
  'bellona': 'BNA',
  'kiribati': 'TRW',
  'tarawa': 'TRW',
  'christmas island': 'XCH',
  'cocos islands': 'CCK',
  'norfolk island': 'NLK',
  'lord howe island': 'LDH',
  'coral sea islands': 'CNS',
  'ashmore and cartier islands': 'PER',
  'cook islands': 'RAR',
  'rarotonga': 'RAR',
  'french polynesia': 'PPT',
  'tahiti': 'PPT',
  'papeete': 'PPT',
  'bora bora': 'BOB',
  'huahine': 'HUH',
  'raiatea': 'RAI',
  'taha': 'RAI',
  'faaa': 'PPT',
  'tuamotu': 'PPT',
  'marquesas': 'PPT',
  'austral islands': 'PPT',
  'pitcairn islands': 'PIU',
  'easter island': 'IPC',
  'rapa nui': 'IPC',
  'palau': 'ROR',
  'koror': 'ROR',
  'angaur': 'ROR',
  'peleliu': 'ROR',
  'micronesia': 'KSA',
  'pohnpei': 'PNI',
  'kosrae': 'KSA',
  'chuuk': 'TT',
  'yap': 'YAP',
  'marshall islands': 'MHH',
  'majuro': 'MHH',
  'kwajalein': 'KWA',
  'arno': 'MHH',
  'mili': 'MHH',
  'nauru': 'INU',
  'tuvalu': 'FUN',
  'funafuti': 'FUN',
  'wallis and futuna': 'WLS',
  'mata utu': 'WLS',
  
  // Additional Global Capitals & Major Cities
  'afghanistan': 'KBL',
  'kabul': 'KBL',
  'albania': 'TIA',
  'tirana': 'TIA',
  'algeria': 'ALG',
  'algiers': 'ALG',
  'andorra': 'ALV',
  'andorra la vella': 'ALV',
  'angola': 'LAD',
  'luanda': 'LAD',
  'antigua and barbuda': 'ANU',
  'saint johns': 'ANU',
  'argentina': 'EZE',
  'yerevan': 'EVN',
  'austria': 'VIE',
  'azerbaijan': 'GYD',
  'baku': 'GYD',
  'bahamas': 'ANU',
  'nassau': 'NAS',
  'bangladesh': 'DAC',
  'barbados': 'NAS',
  'belarus': 'MSQ',
  'minsk': 'MSQ',
  'belgium': 'BRU',
  'bhutan': 'TBU',
  'thimphu': 'TBU',
  'bolivia': 'VVI',
  'la paz bolivia': 'LPB',
  'bosnia': 'SJJ',
  'sarajevo': 'SJJ',
  'botswana': 'LUN',
  'gaborone': 'GBE',
  'bulgaria': 'SOF',
  'burkina faso': 'OUA',
  'burundi': 'BJM',
  'cambodia': 'PNH',
  'cameroon': 'NSI',
  'chad': 'NDJ',
  'ndjamena': 'NDJ',
  'chile': 'SCL',
  'colombia': 'BOG',
  'comoros': 'INU',
  'republic of the congo': 'BZV',
  'croatia': 'ZAG',
  'zagreb': 'ZAG',
  'cuba': 'HAV',
  'havana': 'HAV',
  'cyprus': 'LCA',
  'nicosia': 'LCA',
  'czech republic': 'PRG',
  'denmark': 'CPH',
  'djibouti': 'NDJ',
  'dominican republic': 'SDQ',
  'santo domingo': 'SDQ',
  'ecuador': 'UIO',
  'egypt': 'CAI',
  'el salvador': 'SAL',
  'equatorial guinea': 'SSG',
  'malabo': 'SSG',
  'eritrea': 'JIB',
  'asmara': 'ASM',
  'estonia': 'TLL',
  'tallinn': 'TLL',
  'ethiopia': 'ADD',
  'finland': 'CPH',
  'helsinki': 'HEL',
  'france': 'CDG',
  'gabon': 'LBV',
  'libreville': 'LBV',
  'gambia': 'DSS',
  'banjul': 'BJL',
  'georgia': 'TBS',
  'tbilisi': 'TBS',
  'germany': 'FRA',
  'ghana': 'ACC',
  'greece': 'ATH',
  'guatemala': 'GUA',
  'guinea': 'CKY',
  'conakry': 'CKY',
  'guyana': 'GEO',
  'haiti': 'HAV',
  'port au prince': 'PAP',
  'honduras': 'TGU',
  'hungary': 'BUD',
  'iceland': 'KEF',
  'india': 'DEL',
  'indonesia': 'CGK',
  'iran': 'IKA',
  'iraq': 'BGW',
  'ireland': 'DUB',
  'israel': 'TLV',
  'italy': 'FCO',
  'jamaica': 'BGI',
  'kingston': 'KIN',
  'japan': 'HND',
  'jordan': 'AMM',
  'kazakhstan': 'ALA',
  'astana': 'NQZ',
  'almaty': 'ALA',
  'kenya': 'NBO',
  'kyrgyzstan': 'FRU',
  'bishkek': 'FRU',
  'laos': 'VTE',
  'latvia': 'RIX',
  'riga': 'RIX',
  'lebanon': 'BEY',
  'lesotho': 'MSU',
  'maseru': 'MSU',
  'liberia': 'ROB',
  'monrovia': 'ROB',
  'libya': 'TIP',
  'tripoli': 'TIP',
  'lithuania': 'VNO',
  'vilnius': 'VNO',
  'madagascar': 'LBV',
  'antananarivo': 'TNR',
  'malawi': 'GBE',
  'lilongwe': 'LLW',
  'malaysia': 'KUL',
  'mali': 'BKO',
  'malta': 'MLA',
  'valletta': 'MLA',
  'mexico': 'MEX',
  'moldova': 'VNO',
  'chisinau': 'KIV',
  'mongolia': 'UBN',
  'ulaanbaatar': 'UBN',
  'montenegro': 'KIV',
  'podgorica': 'TGD',
  'morocco': 'CMN',
  'mozambique': 'MPM',
  'myanmar': 'RGN',
  'namibia': 'WDH',
  'windhoek': 'WDH',
  'nepal': 'KTM',
  'netherlands': 'AMS',
  'new zealand': 'AKL',
  'nicaragua': 'MGA',
  'niger': 'NIM',
  'nigeria': 'LOS',
  'abuja': 'ABV',
  'north macedonia': 'TGD',
  'skopje': 'TGD',
  'norway': 'OSL',
  'pakistan': 'ISB',
  'panama': 'PTY',
  'papua new guinea': 'HIR',
  'port moresby': 'POM',
  'paraguay': 'ASU',
  'peru': 'LIM',
  'philippines': 'MNL',
  'poland': 'WAW',
  'portugal': 'LIS',
  'qatar': 'DOH',
  'romania': 'OTP',
  'russia': 'SVO',
  'moscow': 'SVO',
  'rwanda': 'KGL',
  'saudi arabia': 'RUH',
  'senegal': 'DSS',
  'serbia': 'BEG',
  'belgrade': 'BEG',
  'sierra leone': 'FNA',
  'freetown': 'FNA',
  'slovakia': 'BEG',
  'bratislava': 'TAS',
  'slovenia': 'VIE',
  'somalia': 'MGQ',
  'mogadishu': 'MGQ',
  'south africa': 'JNB',
  'south korea': 'ICN',
  'south sudan': 'MGQ',
  'juba': 'JUB',
  'spain': 'MAD',
  'sudan': 'KRT',
  'swaziland': 'MTS',
  'sweden': 'ARN',
  'switzerland': 'ZRH',
  'syria': 'DAM',
  'taiwan': 'TPE',
  'tajikistan': 'DYU',
  'dushanbe': 'DYU',
  'tanzania': 'DAR',
  'thailand': 'BKK',
  'togo': 'CKY',
  'lome': 'LFW',
  'trinidad and tobago': 'POS',
  'port of spain': 'POS',
  'tunisia': 'TUN',
  'turkey': 'IST',
  'turkmenistan': 'ASB',
  'ashgabat': 'ASB',
  'uganda': 'DAR',
  'ukraine': 'KBP',
  'kyiv': 'KBP',
  'united arab emirates': 'DXB',
  'united kingdom': 'LHR',
  'united states': 'JFK',
  'uruguay': 'MVD',
  'uzbekistan': 'TAS',
  'tashkent': 'TAS',
  'venezuela': 'CCS',
  'vietnam': 'HAN',
  'yemen': 'SAH',
  'sanaa': 'SAH',
  'zambia': 'LUN',
  'zimbabwe': 'HRE'
};

/**
 * Convert location name to airport code
 * Uses expanded fallback mapping covering 200+ major global airports
 * @param {string} location - City or location name
 * @returns {string} Airport code or null if not found
 */
const getAirportCode = (location) => {
  if (!location) return null;

  const normalized = location
    .toLowerCase()
    .trim()
    .split(',')[0] // Take only city name
    .trim();

  // Add explicit cases for Greece
  const specialCases = {
    'greece': 'ATH',
    'athens': 'ATH',
    'santorini': 'JTR',
    'mykonos': 'JMK',
    'crete': 'HER',
    'rhodes': 'RHO', 
  };
  
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }

  // Check if already an airport code (3 uppercase letters)
  if (/^[A-Z]{3}$/.test(location.trim())) {
    console.log(`✅ Already an airport code: ${location}`);
    return location.trim();
  }

  // Check mapping (now expanded to 200+ cities)
  if (CITY_TO_AIRPORT[normalized]) {
    const code = CITY_TO_AIRPORT[normalized];
    console.log(`✅ Found in mapping: ${normalized} → ${code}`);
    return code;
  }

  // Try partial matching for variations (e.g., "New York City" or "New York, USA")
  for (const [city, code] of Object.entries(CITY_TO_AIRPORT)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      console.log(`✅ Found via partial match: ${city} → ${code}`);
      return code;
    }
  }

  // If not found, return null (will cause backend validation to fail with clear message)
  console.log(`⚠️ No airport code found for: ${normalized}`);
  return null;
};

/**
 * Fetch flight data from backend API (which calls SerpAPI)
 * @param {Object} params - Flight search parameters
 * @param {string} params.departure - Departure airport code or city (e.g., 'DEL', 'Delhi')
 * @param {string} params.arrival - Arrival airport code or city (e.g., 'BKK', 'Bangkok')
 * @param {string} params.outbound_date - Outbound date in YYYY-MM-DD format
 * @param {string} params.return_date - Return date in YYYY-MM-DD format (optional, for round trip)
 * @param {string} params.currency - Currency code (default: 'USD')
 * @returns {Promise<Object>} Flight data from SerpAPI
 */

export const fetchFlights = async ({
  departure,
  arrival,
  outbound_date,
  return_date,
  adults = 1,
  currency = 'USD',
}) => {
  try {
    console.log('🛫 Starting flight search...');
    console.log(`  From: ${departure}`);
    console.log(`  To: ${arrival}`);
    console.log(`  Dates: ${outbound_date} → ${return_date}`);

    // Convert location names to airport codes (from expanded mapping)
    const departureCode = getAirportCode(departure);
    const arrivalCode = getAirportCode(arrival);

    if (!departureCode) {
      throw new Error(`Could not find airport code for departure: "${departure}". Please check the city name.`);
    }
    if (!arrivalCode) {
      throw new Error(`Could not find airport code for arrival: "${arrival}". Please check the city name.`);
    }

    console.log(`✅ Airport codes - Departure: ${departureCode}, Arrival: ${arrivalCode}`);

    const requestBody = {
      departure: departureCode,
      arrival: arrivalCode,
      outbound_date,
      currency,
      adults,
    };

    if (return_date) {
      requestBody.return_date = return_date;
    }

    console.log('📡 Sending flight request to backend with airport codes:', {
      departure: departureCode,
      arrival: arrivalCode,
      outbound_date,
      return_date,
      currency,
      adults,
    });

    // Call backend API endpoint
    const response = await axios.post('/api/flights', requestBody);

    if (response?.status !== 200) {
      throw new Error(`API returned status ${response?.status}`);
    }

    console.log('✅ Flight data received from backend');

    return {
      success: true,
      data: response?.data?.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
    console.error('❌ Flight API Error:', errorMsg);
    console.error('Full error:', error?.response?.data || error);


    return {
      success: false,
      error: error?.message || 'Failed to fetch flights',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Parse flight results from SerpAPI response
 * @param {Object} apiResponse - Raw response from SerpAPI
 * @returns {Object} Parsed flights data with outbound and return flights
 */

export const parseFlightResults = (apiResponse) => {
  try {
    if (!apiResponse?.data) {
      console.log('⚠️ No API data received');
      return {
        outboundFlights: [],
        returnFlights: [],
        bestPrice: null,
        airlines: [],
      };
    }

    const data = apiResponse.data;
    console.log('📊 API Response Structure:', {
      hasBestFlights: !!data?.best_flights,
      hasReturnFlights: !!data?.return_flights,
      bestFlightsCount: data?.best_flights?.length || 0,
      returnFlightsCount: data?.return_flights?.length || 0,
      dataKeys: Object.keys(data || {}),
    });

    // Get best flights for outbound
    const outboundFlights = (data?.best_flights || [])
      .slice(0, 10)
      .map(parseFlightItem)
      .filter((f) => f !== null);

    console.log(`✅ Parsed ${outboundFlights.length} outbound flights from best_flights`);

    // Get return flights - try multiple possible data structures from SerpAPI
    let returnFlights = [];
    
    if (data?.return_flights && Array.isArray(data.return_flights)) {
      console.log('📍 Found return_flights in response, parsing...');
      returnFlights = data.return_flights
        .slice(0, 10)
        .map(parseFlightItem)
        .filter((f) => f !== null);
      console.log(`✅ Parsed ${returnFlights.length} return flights`);
    } else if (data?.return_flights && typeof data.return_flights === 'object') {
      // Sometimes SerpAPI returns return flights in a different structure
      console.log('📍 return_flights is object, checking structure...', data.return_flights);
      if (data.return_flights.best_flights) {
        returnFlights = (data.return_flights.best_flights || [])
          .slice(0, 10)
          .map(parseFlightItem)
          .filter((f) => f !== null);
        console.log(`✅ Parsed ${returnFlights.length} return flights from return_flights.best_flights`);
      }
    } else {
      console.log('⚠️ No return_flights found in response');
    }

    // Get all available airlines
    const airlines = Array.from(
      new Set(
        [...outboundFlights, ...returnFlights]
          .flatMap((f) => f.airlines || [])
          .map((a) => a.name)
      )
    );

    // Find best price
    const allFlights = [...outboundFlights, ...returnFlights];
    const bestPrice = allFlights.length > 0
      ? Math.min(...allFlights.map((f) => Number.parseFloat(f.price) || Infinity))
      : null;

    console.log('📋 Final Parsed Results:', {
      outboundCount: outboundFlights.length,
      returnCount: returnFlights.length,
      airlinesCount: airlines.length,
      bestPrice,
    });

    return {
      outboundFlights,
      returnFlights,
      bestPrice,
      airlines,
      allFlightsFromAPI: outboundFlights,
      returnFlightsFromAPI: returnFlights,
    };
  } catch (error) {
    console.error('❌ Error parsing flight results:', error);
    console.error('Stack:', error.stack);
    return {
      outboundFlights: [],
      returnFlights: [],
      bestPrice: null,
      airlines: [],
    };
  }
};

/**
 * Parse individual flight item from API response
 * @param {Object} flight - Flight object from API
 * @returns {Object} Parsed flight data or null
 */

const parseFlightItem = (flight) => {
  try {
    if (!flight) return null;

    const legs = flight?.flights || [];
    if (legs.length === 0) return null;

    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];

    return {
      id: flight?.id || Math.random().toString(36),
      price: flight?.price || 'N/A',
      duration: flight?.total_duration || 'N/A',
      airline: firstLeg?.airline || 'N/A',
      airlines: legs.map((leg) => ({
        name: leg?.airline || 'N/A',
        logo: leg?.airline_logo || '',
      })),
      departureTime: firstLeg?.departure_airport?.time || 'N/A',
      arrivalTime: lastLeg?.arrival_airport?.time || 'N/A',
      departureAirport: firstLeg?.departure_airport?.name || firstLeg?.departure_airport?.id || 'N/A',
      arrivalAirport: lastLeg?.arrival_airport?.name || lastLeg?.arrival_airport?.id || 'N/A',
      stops: flight?.layovers?.length || 0,
      isRoundtrip: legs.length > 1,
      legs: legs.map((leg) => ({
        airline: leg?.airline || 'N/A',
        departure_time: leg?.departure_airport?.time || 'N/A',
        arrival_time: leg?.arrival_airport?.time || 'N/A',
        departure_airport: leg?.departure_airport?.id || 'N/A',
        arrival_airport: leg?.arrival_airport?.id || 'N/A',
        duration: leg?.duration || 'N/A',
        airplane: leg?.airplane || 'N/A',
      })),
      layovers: flight?.layovers || [],
      bookingToken: flight?.booking_token || null,
      rawData: flight,
    };
  } catch (error) {
    console.error('Error parsing flight item:', error, flight);
    return null;
  }
};
