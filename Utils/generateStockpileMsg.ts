import { getCollections } from '../mongoDB';

const lowerToOriginal: any = {
    'dusk ce.iii': 'Dusk ce.III',
    'booker storm rifle model 838': 'Booker Storm Rifle Model 838',
    'aalto storm rifle 24': 'Aalto Storm Rifle 24',
    '7.92mm': '7.92mm',
    'catara mo. ii': 'Catara mo. II',
    'krn886-127 gast machine gun': 'KRN886-127 Gast Machine Gun',
    'malone mk.2': 'Malone MK.2',
    '12.7mm': '12.7mm',
    'pt-815 smoke grenade': 'PT-815 Smoke Grenade',
    'ferro 879': 'Ferro 879',
    'cascadier 873': 'Cascadier 873',
    '8mm': '8mm',
    'cometa t2-9': 'Cometa T2-9',
    'the hangman 757': 'The Hangman 757',
    '0.44': '0.44',
    'sampo auto-rifle 77': 'Sampo Auto-Rifle 77',
    'argentir r.ii rifle': 'Argentir r.II Rifle',
    'volta r.i repeater': 'Volta r.I Repeater',
    'fuscina pi.i': 'Fuscina pi.I',
    'blakerow 871': 'Blakerow 871',
    'krr2-790 omen': 'KRR2-790 Omen',
    'clancy cinder m3': 'Clancy Cinder M3',
    'no.2 loughcaster': 'No.2 Loughcaster',
    '7.62mm': '7.62mm',
    'brasa shotgun': 'Brasa Shotgun',
    buckshot: 'Buckshot',
    'the pitch gun mc.v': 'The Pitch Gun mc.V',
    'lionclaw mc.viii': 'Lionclaw mc.VIII',
    'no.1 "the liar" submachinegun': 'No.1 "The Liar" Submachinegun',
    'fiddler submachine gun model 868': 'Fiddler Submachine Gun Model 868',
    '9mm smg': '9mm SMG',
    'krr3-792 auger': 'KRR3-792 Auger',
    'clancy-raca m4': 'Clancy-Raca M4',
    '8.5mm': '8.5mm',
    '20 neville anti-tank rifle': '20 Neville Anti-Tank Rifle',
    '20mm': '20mm',
    'venom c.ii 35': 'Venom c.II 35',
    'bane 45': 'Bane 45',
    'a.t.r.p.g. shell': 'A.T.R.P.G. Shell',
    'bonesaw mk.3': 'Bonesaw MK.3',
    'a.t.r.p.g. indirect shell': 'A.T.R.P.G. Indirect Shell',
    'cremari mortar': 'Cremari Mortar',
    'mortar flare shell': 'Mortar Flare Shell',
    'mortar shrapnel shell': 'Mortar Shrapnel Shell',
    'mortar shell': 'Mortar Shell',
    'bf5 white ash flask grenade': 'BF5 White Ash Flask Grenade',
    'ignifist 30': 'Ignifist 30',
    'mounted bonesaw mk.3': 'Mounted Bonesaw MK.3',
    'green ash grenade': 'Green Ash Grenade',
    'bombastone grenade': 'Bombastone Grenade',
    'a3 harpa fragmentation grenade': 'A3 Harpa Fragmentation Grenade',
    '150mm': '150mm',
    'mammon 91-b': 'Mammon 91-b',
    'daucus isg.iii': 'Daucus isg.III',
    '120mm': '120mm',
    '300mm': '300mm',
    '250mm': '250mm',
    'anti-tank sticky bomb': 'Anti-Tank Sticky Bomb',
    'cutler launcher 4': 'Cutler Launcher 4',
    'r.p.g. shell': 'R.P.G. Shell',
    '68mm at': '68mm AT',
    '75mm round': '75mm Round',
    '40mm round': '40mm Round',
    '30mm': '30mm',
    warhead: 'Warhead',
    binoculars: 'Binoculars',
    "hydra's whisper": "Hydra's Whisper",
    'listening kit': 'Listening Kit',
    'radio backpack': 'Radio Backpack',
    'alligator charge': 'Alligator Charge',
    shovel: 'Shovel',
    'sledge hammer': 'Sledge Hammer',
    'abisme at-99': 'Abisme AT-99',
    tripod: 'Tripod',
    hammer: 'Hammer',
    wrench: 'Wrench',
    'buckhorn ccq-18': 'Buckhorn CCQ-18',
    'gas mask': 'Gas Mask',
    'gas mask filter': 'Gas Mask Filter',
    radio: 'Radio',
    'rocket booster': 'Rocket Booster',
    bandages: 'Bandages',
    'first aid kit': 'First Aid Kit',
    'trauma kit': 'Trauma Kit',
    'blood plasma': 'Blood Plasma',
    'soldier supplies': 'Soldier Supplies',
    diesel: 'Diesel',
    petrol: 'Petrol',
    'aluminum alloy': 'Aluminum Alloy',
    'bunker supplies': 'Bunker Supplies',
    'basic materials': 'Basic Materials',
    'explosive materials': 'Explosive Materials',
    'garrison supplies': 'Garrison Supplies',
    'heavy explosive materials': 'Heavy Explosive Materials',
    'iron alloy': 'Iron Alloy',
    'refined materials': 'Refined Materials',
    salvage: 'Salvage',
    components: 'Components',
    sulfur: 'Sulfur',
    aluminum: 'Aluminum',
    iron: 'Iron',
    wreckage: 'Wreckage',
    'concrete materials': 'Concrete Materials',
    'crude oil': 'Crude Oil',
    "specialist's overcoat": "Specialist's Overcoat",
    'fabri rucksack': 'Fabri Rucksack',
    'sapper gear': 'Sapper Gear',
    "grenadier's baldric": "Grenadier's Baldric",
    'medic fatigues': 'Medic Fatigues',
    "physician's jacket": "Physician's Jacket",
    "legionary's oilcoat": "Legionary's Oilcoat",
    'recon camo': 'Recon Camo',
    "outrider's mantle": "Outrider's Mantle",
    'heavy topcoat': 'Heavy Topcoat',
    'caoivish parka': 'Caoivish Parka',
    'legionary fatigues': 'Legionary Fatigues',
    'infantry battledress': 'Infantry Battledress',
    "tankman's coveralls": "Tankman's Coveralls",
    'padded boiler suit': 'Padded Boiler Suit',
    'r-12 - "salus" ambulance': 'R-12 - "Salus" Ambulance',
    'dunne responder 3e': 'Dunne Responder 3e',
    't3 "xiphos"': 'T3 "Xiphos"',
    't12 "actaeon" tankette': 'T12 "Actaeon" Tankette',
    "o'brien v.121 highlander": "O'Brien v.121 Highlander",
    't5 "percutio"': 'T5 "Percutio"',
    "o'brien v.101 freeman": "O'Brien v.101 Freeman",
    "o'brien v.110": "O'Brien v.110",
    'bms - aquatipper': 'BMS - Aquatipper',
    'blumfield lk205': 'Blumfield LK205',
    'r-15 - "chariot"': 'R-15 - "Chariot"',
    'dunne caravaner 2f': 'Dunne Caravaner 2f',
    'bms - universal assembly rig': 'BMS - Universal Assembly Rig',
    'bms - class 2 mobile auto-crane': 'BMS - Class 2 Mobile Auto-Crane',
    'noble widow mk. xiv': 'Noble Widow MK. XIV',
    'aa-2 battering ram': 'AA-2 Battering Ram',
    '68-45 "smelter" heavy field gun': '68-45 "Smelter" Heavy Field Gun',
    'collins cannon 68mm': 'Collins Cannon 68mm',
    'balfour rampart 40mm': 'Balfour Rampart 40mm',
    'balfour wolfhound 40mm': 'Balfour Wolfhound 40mm',
    '120-68 "koronides" field gun': '120-68 "Koronides" Field Gun',
    'g40 "sagittarii"': 'G40 "Sagittarii"',
    'swallowtail 988/127-2': 'Swallowtail 988/127-2',
    'balfour falconer 250mm': 'Balfour Falconer 250mm',
    'bms - packmule flatbed': 'BMS - Packmule Flatbed',
    'bms - ironship': 'BMS - Ironship',
    'type c - "charon"': 'Type C - "Charon"',
    '74c-2 ronan meteora gunship': '74c-2 Ronan Meteora Gunship',
    '74b-1 ronan gunship': '74b-1 Ronan Gunship',
    'hh-d "peltast"': 'HH-d "Peltast"',
    'hh-a "javelin"': 'HH-a "Javelin"',
    'hh-b "hoplite"': 'HH-b "Hoplite"',
    'niska mk. ii blinder': 'Niska Mk. II Blinder',
    'niska mk. i gun motor carriage': 'Niska Mk. I Gun Motor Carriage',
    'bms - scrap hauler': 'BMS - Scrap Hauler',
    'ab-8 "acheron"': 'AB-8 "Acheron"',
    'ab-11 "doru"': 'AB-11 "Doru"',
    'mulloy apc': 'Mulloy APC',
    'hc-2 "scorpion"': 'HC-2 "Scorpion"',
    'devitt-caine mk. iv mmr': 'Devitt-Caine Mk. IV MMR',
    'h5 "hatchet"': 'H5 "Hatchet"',
    'devitt ironhide mk. iv': 'Devitt Ironhide Mk. IV',
    'h-8 "kraneska"': 'H-8 "Kraneska"',
    'h-10 "pelekys"': 'H-10 "Pelekys"',
    'devitt mk. iii': 'Devitt Mk. III',
    '86k-a "bardiche"': '86K-a "Bardiche"',
    'gallagher outlaw mk. ii': 'Gallagher Outlaw Mk. II',
    '85k-b "falchion"': '85K-b "Falchion"',
    '85k-a "spatha"': '85K-a "Spatha"',
    'silverhand chieftain - mk. vi': 'Silverhand Chieftain - Mk. VI',
    'silverhand - mk. iv': 'Silverhand - Mk. IV',
    'hc-7 "ballista"': 'HC-7 "Ballista"',
    '03mm "caster"': '03MM "Caster"',
    '00ms "stinger"': '00MS "Stinger"',
    'kivela power wheel 80-1': 'Kivela Power Wheel 80-1',
    'rr-3 "stolon" tanker.': 'RR-3 "Stolon" Tanker.',
    'dunne fuelrunner 2d': 'Dunne Fuelrunner 2d',
    'king gallant mk. ii': 'King Gallant Mk. II',
    'king spire mk. i': 'King Spire Mk. I',
    'uv-05a "argonaut"': 'UV-05a "Argonaut"',
    'uv-24 "icarus"': 'UV-24 "Icarus"',
    'drummond spitfire 100d': 'Drummond Spitfire 100d',
    'uv-5c "odyssey"': 'UV-5c "Odyssey"',
    'drummond loscann 55c': 'Drummond Loscann 55c',
    'drummond 100a': 'Drummond 100a',
    't20 "ixion" tankette': 'T20 "Ixion" Tankette',
    'bms - white whale': 'BMS - White Whale',
    'r-1 hauler': 'R-1 Hauler',
    'dunne leatherback 2a': 'Dunne Leatherback 2a',
    'r-5 "atlas" hauler': 'R-5 "Atlas" Hauler',
    'dunne loadlugger 3c': 'Dunne Loadlugger 3c',
    'r-5b "sisyphus" hauler': 'R-5b "Sisyphus" Hauler',
    'dunne landrunner 12c': 'Dunne Landrunner 12c',
    'r-9 "speartip" escort"': 'R-9 "Speartip" Escort"',
    'dunne transport': 'Dunne Transport',
    'barbed wire pallet': 'Barbed Wire Pallet',
    'concrete mixer': 'Concrete Mixer',
    '68mm anti-tank cannon': '68mm Anti-Tank Cannon',
    '50-500 "thunderbolt" cannon': '50-500 "Thunderbolt" Cannon',
    'huber exalt 150mm': 'Huber Exalt 150mm',
    'huber lariat 120mm': 'Huber Lariat 120mm',
    '12.7 anti infantry flak gun': '12.7 Anti Infantry Flak Gun',
    'metal beam pallet': 'Metal Beam Pallet',
    'resource container': 'Resource Container',
    'sandbag pallet': 'Sandbag Pallet',
    'shipping container': 'Shipping Container',
    'small shipping container': 'Small Shipping Container',
    'barbed wire': 'Barbed Wire',
    sandbags: 'Sandbags',
    'metal beam': 'Metal Beam',
    'lamentum mm.iv': 'Lamentum mm.IV',
    '"typhon" ra.xii': '"Typhon" ra.XII',
    'culter foebreaker': 'Culter Foebreaker',
    'ahti model 2': 'Ahti Model 2',
    'malone ratcatcher mk. 1': 'Malone Ratcatcher Mk. 1',
    copper: 'Copper',
    'copper alloy': 'Copper Alloy'
}

const generateMsg = async (updateMsg: boolean): Promise<Array<any>> => {
    const collections = getCollections()
    let stockpileHeader = "**__Stockpiler Discord Bot Report__** \n_All quantities in **crates**_"
    let stockpileMsgsHeader = "**__Stockpiles__** \n\n ----------"
    let stockpileMsgs = NodeCacheObj.get("stockpileHeader") as Array<string>
    let targetMsg = NodeCacheObj.get("targetMsg") as string

    if (updateMsg || !stockpileMsgs || !targetMsg) {
        const targets = await collections.targets.findOne({})
        const stockpilesList = await collections.stockpiles.find({}).toArray()
        const configObj = (await collections.config.findOne({}))!

        let stockpiles: Array<any> = []
        if ("orderSettings" in configObj) {
            for (let i = 0; i < configObj.orderSettings.length; i++) {
                for (let x = 0; x < stockpilesList.length; x++) {
                    if (stockpilesList[x].name === configObj.orderSettings[i]) {
                        stockpiles.push(stockpilesList[x])
                        break
                    }
                }
            }
        }
        else stockpiles = stockpilesList

        stockpileMsgs = []
        const totals: any = {}


        for (let i = 0; i < stockpiles.length; i++) {
            const current = stockpiles[i]
            stockpileMsgs.push("")
            stockpileMsgs[i] += `**${current.name}** (as of <t:${Math.floor(current.lastUpdated.getTime() / 1000)}>)\n`
            for (const item in current.items) {

                stockpileMsgs[i] += "`" + lowerToOriginal[item].replace(/\_/g, ".") + "` - " + current.items[item] + "\n"

                if (item in totals) totals[item] += current.items[item]
                else totals[item] = current.items[item]

            }
            stockpileMsgs[i] += "----------"
        }

        targetMsg = "**__Targets__** \n\n"
        if (targets) {
            for (const target in targets) {
                if (target !== "_id") {
                    targetMsg += `\`${lowerToOriginal[target].replace(/\_/g, ".")}\` - ${target in totals ? totals[target] : "0"}/${targets[target].min} ${totals[target] >= targets[target].min ? "✅" : "❌"} (Max: ${targets[target].max})\n`
                }
            }
        }
        targetMsg += "\n"

        NodeCacheObj.set("stockpileMsgs", stockpileMsgs)
        NodeCacheObj.set("targetMsg", targetMsg)
    }

    return [stockpileHeader, stockpileMsgs, targetMsg, stockpileMsgsHeader]
}


export default generateMsg
