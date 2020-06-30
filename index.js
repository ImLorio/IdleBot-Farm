const Discord = require('discord.js');
const bot = new Discord.Client();
const moment = require('moment');
const fs = require('fs');
const Tesseract = require('tesseract.js')
moment.defaultFormat = "LTS"


/* --------------------------------------------------

- Auto Farm
- Auto Rebirth
- Auto Upgrade w/ Inteligent Upgrade
- Auto Update Stats
- Auto Fish
- Auto Hunt
- Auto Claim
- Auto Crates

*/
// Channel ID (where you want to use the bot)
let botchannelID = require('./config.json').botchannelID;
let IdleMinerBotID = require('./config.json').IdleMinerBotID;
if (require('./config.json').token === "") return console.log(`[${moment().format('LTS')}] token is not defined. (in config.js)`);
if (botchannelID === "") return console.log(`[${moment().format('LTS')}] BotChannel is not defined. (in config.js)`);
if (IdleMinerBotID === "") return console.log(`[${moment().format('LTS')}] IdleMinerBotID is not defined. (in config.js)`);


// --------------------------------------------------

//#region Useless Quiz variable
let quizData = [{
    question: `What happens to a pig when it is struck by lightning?`,
    anwser: `It turns into a Zombie Pigman`
}, {
    question: `Which of these items might drop when killing an Enderman?`,
    anwser: `Ender Pearl`
}, {
    question: `Not all mobs receive fall damage.`,
    anwser: `True`
}, {
    question: `You can put a chest on a donkey.`,
    anwser: `True`
}, {
    question: `The Ender Dragon's fireballs can be deflected.`,
    anwser: `False`
}, {
    question: `There is an achievement related to pigs falling off cliffs.`,
    anwser: `True`
}, {
    question: `How many Ender Pearls can fit into a single inventory slot?`,
    anwser: `16`
}, {
    question: `Which block is shown in the picture?`,
    anwser: `Missing texture block`
}, {
    question: ``,
    anwser: ``
}]
/*, {
    question: ``,
    anwser: ``
}*/
//#endregion
//#region Source Code
let botChannel;
let myMoney, myPickaxeLevel, myBackpackLevel, myRebirth, myMobs = [];
let priceNextPickaxe, priceNextBackpack;
let humanverif = false;
let i = 0;

bot.on('ready', async () => {
    console.log(`[${moment().format('LTS')}] I'm ready to farm!`)

    botChannel = bot.channels.find(b => b.id === botchannelID)
    if (!botChannel) console.log(`[${moment().format('LTS')}] ERROR: I can't find your channel !`)

    await updateInterval()
    await updateStats()
    setTimeout(() => {
        startSell(45)
    }, 5000);

    setInterval(async () => {
        if (humanverif) return console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)
        upgrade()
        i++
        if (i >= 5) {
            i = 0;
            useMobs()
            await botChannel.send(`;fish`)
            await botChannel.send(`;hunt`)
            await botChannel.send(`;claimall`)
            await botChannel.send(`;open all`)
            console.log(`[${moment().format('LTS')}] Fish, Hunt, Claimall and Openall has been executed.`)
        }
    }, 60 * 1050)
})

bot.on('message', async message => {
    if (message.author.id === bot.user.id) {
        if (message.content === 'i!update') updateInterval()
        if (message.content === 'i!open') openAllCreate()
    }
    if (message.author.id !== IdleMinerBotID) return;
    if (message.channel.type === "dm") {
        if (message.attachments) {
            let code = await humanVerifBypass(message.attachments.first().url)
            message.channel.send(code)
            console.log(`[${moment().format('LTS')}] Code: ${code}`)
        }
        humanverif = true
    }
    if (message.channel.id !== botchannelID) return;
    if (message.embeds[0]) {
        let embed = message.embeds[0]
        if (embed.author.name.includes(bot.user.username) || embed.author.name.includes(bot.user.tag)) {} else return;
        if (embed.title) {
            if (embed.title.includes('Sold')) {
                let sellOutput = [];
                sellOutput.push(`[${moment().format('LTS')}] You sell ${embed.title.split(' ')[1]} item(s) for ${embed.description.split('\n').find(l => l.includes('Total:')).split(' ')[1].substr(1).slice(0, -2)}$.`)
                if (embed.description.split('\n').find(l => l.includes('Global'))) sellOutput.push(`BONUS: ${embed.description.split('\n').find(l => l.includes('Global')).split(' ')[6].substr(3).slice(0, -2)}$`)
                myMoney = embed.description.split('\n').find(l => l.includes('You now have')).split(' ')[3].substr(1).slice(0, -2)
                console.log(sellOutput.join(' '))
                updateTitle()
            }
            if (embed.title.includes('Upgrade')) {
                if (embed.fields.find(f => f.name === "**Pickaxe**")) priceNextPickaxe = embed.fields.find(f => f.name === "**Pickaxe**").value.split('\n')[1].split('$')[1]
                if (embed.fields.find(f => f.name === "**Backpack**")) priceNextBackpack = embed.fields.find(f => f.name === "**Backpack**").value.split('\n')[1].split('$')[1]
                console.log(`[${moment().format('LTS')}] Prices for next upgrade is update.`)
            }
            if (embed.title.includes('Crates')) {
                if (embed.description.includes('You opened')) return;
                if (!embed.description.includes(`You don't have any crates yet!`)) await botChannel.send(`;open all`)
            }
            if (embed.title.includes('Pets')) {
                if (embed.fields.find(f => f.name === "**Legendary**")) {
                    let mobs = embed.fields.find(f => f.name === "**Legendary**").value;
                    if (mobs.includes('Giant') && (!myMobs.includes('Giant'))) myMobs.push('Giant');
                    if (mobs.includes('Wither') && (!myMobs.includes('Wither'))) myMobs.push('Wither');
                    if (mobs.includes('Ender-dragon') && (!myMobs.includes('Ender-dragon'))) myMobs.push('Ender-dragon');
                }
            }
        }
        if (embed.fields[0]) {
            if (embed.fields.find(f => f.name === "**General**")) {
                if (embed.fields.find(f => f.name === "**Backpack**")) myBackpackLevel = embed.fields.find(f => f.name === "**Backpack**").value.split('[')[1].split(']')[0].split(' ')[1]
                if (embed.fields.find(f => f.name === "**Pickaxe**")) myPickaxeLevel = embed.fields.find(f => f.name === "**Pickaxe**").value.split('[')[1].split(']')[0].split(' ')[1]
                myMoney = embed.fields.find(f => f.name === "**General**").value.split('\n')[0].split('$')[1]
                myRebirth = embed.fields.find(f => f.value.includes('Rebirth')).value.split('\n')[1].split(':** ')[1]
                console.log(`[${moment().format('LTS')}] Your money is update.`)
            } else {
                if (embed.fields.find(f => f.name === "**Backpack**")) {
                    let value = embed.fields.find(f => f.name === "**Backpack**").value
                    if (value.split('\n').find(l => l.includes('FULL'))) return sell()
                    if (value.split('\n').find(l => l.includes('[----------]'))) {
                        let time = value.split('\n').find(l => l.includes('Full in')).split(' ')[2]
                        let min, sec;
                        if (time.includes('m')) min = time.split('m')[0]
                        if (time.includes('m')) sec = Number(time.split('m')[1].slice(0, -1))
                        if (!min) min = 0;
                        if (!sec) sec = Number(time.slice(0, -1));
                        let newTime = sec + (min * 60)

                        clearInterval(sellInt)
                        startSell(newTime)
                        console.log(`[${moment().format('LTS')}] New interval: ${newTime} seconds.`)
                    }
                }
            }
        }
    }
});

//#region fonction

async function updateTitle() {
    process.title = `IdleMiner FarmBot ~ By Lorio ~ Money: ${myMoney}, pickaxe lvl${myPickaxeLevel}, backpack lvl${myBackpackLevel} ~ ${myRebirth} rebirth`
}
async function humanVerifBypass(link) {
    Tesseract.recognize(
        link,
        'eng', {
            logger: m => console.log(m)
        }
    ).then(({
        data: {
            text
        }
    }) => {
        return text
    })
}
async function useMobs() {
    if (!myMobs) return;
    for (const x in myMobs) {
        const mobs = myMobs[x];
        switch (mobs) {
            case "Ender-dragon":
                botChannel.send(`;wings`);
                console.log(`[${moment().format('LTS')}] EnderDragon used!`);
                break;
            case "Wither":
                botChannel.send(`;rage`);
                console.log(`[${moment().format('LTS')}] Wither used!`);
                break;
            case "Giant":
                botChannel.send(`;earthquake`);
                console.log(`[${moment().format('LTS')}] Giant used!`);
                break;
            default:
                break;
        }
    }
}
async function updateStats() {
    if (humanverif) return console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)

    // console.log(`[${moment().format('LTS')}] Updating Statistique...`)
    await botChannel.send(`;p`)
    await botChannel.send(`;up`)
    await botChannel.send(`;pets`)
}
async function humanVerifSell() {
    if (humanverif) {
        console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)
    } else if (!humanverif) {
        startSell()
    }
    setTimeout(() => {
        humanVerifSell()
    }, 5000);
}
let sellInt
async function startSell(sellInterval) {
    if (humanverif) return humanVerifSell()
    sellInt = setInterval(() => {
        sell()
    }, sellInterval * 1000);
}
async function sell() {
    if (humanverif) return humanVerifSell()
    await botChannel.send(`;s`)
}
async function rebirth() {
    if (myRebirth >= 25) {
        botChannel.send(`;prestige`)
        console.log(`[${moment().format('LTS')}] New prestige...`)
    } else {
        await botChannel.send(`;rebirth`)
        console.log(`[${moment().format('LTS')}] New rebirth...`)
    }
    await updateInterval()
    await updateStats()
}
async function updateInterval() {
    if (humanverif) return console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)

    //console.log(`[${moment().format('LTS')}] Updating Interval...`)
    await sell()
    setTimeout(async () => {
        await botChannel.send(`;bp`)
    }, 500);
}
async function upgrade() {
    if (humanverif) return console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)
    await updateStats()
    console.log(`My Money: ${myMoney} | Next Pickaxe Upgrade: ${priceNextPickaxe} | Next Backpack Upgrade: ${priceNextBackpack}`)
    setTimeout(async () => {
        if (myBackpackLevel >= 200 && myPickaxeLevel >= 200) await rebirth()
        else if (myBackpackLevel <= 25 && myPickaxeLevel >= 50) await upgradeBackpack()
        else if (myPickaxeLevel >= 200) await upgradeBackpack()
        else if (myBackpackLevel <= 100 && myPickaxeLevel >= 100) await upgradeBackpack()
        else if (myPickaxeLevel <= 100) await upgradePickaxe()
        else if (myBackpackLevel >= 100) await upgradePickaxe()
    }, 500);
    updateTitle()
}
async function upgradePickaxe() {
    if (humanverif) return console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)
    if (Number(priceNextPickaxe) >= Number(myMoney)) return console.log(`[${moment().format('LTS')}] I can't upgrade pickaxe: No Money.`)
    await botChannel.send(`;up p a`);
    console.log(`[${moment().format('LTS')}] Upgrading pickaxe...`)
    setTimeout(() => {
        updateInterval()
    }, 2000);
}

async function upgradeBackpack() {
    if (humanverif) return console.log(`[${moment().format('LTS')}] Human verifications... Please wait... (or complete the verif and restart the bot)`)

    if (Number(priceNextBackpack) >= Number(myMoney)) return console.log(`[${moment().format('LTS')}] I can't upgrade backpack: No Money.`)
    await botChannel.send(`;up bp a`);
    console.log(`[${moment().format('LTS')}] Upgrading backpack...`)
    setTimeout(() => {
        updateInterval()
    }, 2000);
}
//#endregion fonction
//#endregion Source Code

bot.login(require('./config.json').token).catch(e => {
    console.log(`[${moment().format('LTS')}] Error: ${e}`);
})
