'use strict'

const fs = require('fs'),
	fn = __dirname + '/blacklist.json',
	defaultBl = [112, 114, 116, 194, 130, 444, 6552, 6553, 6562, 6563, 9310, 9311, 60260, 70000, 80081, 80095, 81209, 150532, 150533, 150534, 150535, 150542, 151643, 155324, 160322, 167001, 177131, 177132, 177133, 200529, 200922, 200999, 201957, 201958, 202015, 206049, 206050, 206051]

let blacklist = []

function ReadFile() { try { blacklist = require(fn) } catch (err) { blacklist = defaultBl } }
ReadFile()

if (fs.existsSync(fn)) fs.watch(fn, event => { if (event === 'change') ReadFile() })

module.exports = function AutoBank(mod) {

	const NotCP = typeof mod.compileProto !== 'undefined'
	if (NotCP) return //Lets see if pinkie will update defs anytime soon.

	// ** Initialize dependency ** \\	
	mod.game.initialize('inventory')

	// ** Variables ** \\	

	let enabled = false,
		GuildBanking = false,
		AddToBl = false,
		RmvFromBl = false,
		curBankContractId = -1,
		lastBankedPageOffset = -1,
		QueuedMsgs = [],
		AllCurrentBankItems = [],
		AllCurrentBankItemsIds = []

	// ** Hook Functions ** \\

	function sViewWareEx(event) {
		if (!enabled) return
		if (lastBankedPageOffset >= event.offset) return false
		if (!GuildBanking && event.container === 3) return Msg('Banking to guild bank is disabled.')
		let toBankItems = []
		if (event.items.length > 0 && mod.game.inventory.items.length > 0) {
			lastBankedPageOffset = event.offset
			for (const bankItem of event.items) {
				{
					const bankItemDub = { offset: event.offset, id: bankItem.id, slot: bankItem.slot },
						dubIndex = AllCurrentBankItemsIds.indexOf(bankItemDub.id)
					if (dubIndex !== -1) {
						const dubItem = AllCurrentBankItems[dubIndex],
							dub1Slot = dubItem.slot - dubItem.offset + 1,
							dub2Slot = bankItemDub.slot - bankItemDub.offset + 1

						if (dubItem.offset !== event.offset) QueuedMsgs.push(`${convToCLA(dubItem.id)} | First (${dubItem.offset / 72 + 1}:${getLine(dub1Slot)}:${dub1Slot !== 8 ? dub1Slot % 8 : 8}) ^ Second (${bankItemDub.offset / 72 + 1}:${getLine(dub2Slot)}:${dub2Slot !== 8 ? dub2Slot % 8 : 8})`)
					}
					AllCurrentBankItems.push(bankItemDub)
					AllCurrentBankItemsIds.push(bankItemDub.id)
				}
				const found = mod.game.inventory.findAllInBagOrPockets(bankItem.id)
				if (found && found.length)
					toBankItems.push(...found)
			}
			toBankItems = toUniqueDbidArr(toBankItems)
			toBankItems = remvBlacklisted(toBankItems)
			for (const toBank of toBankItems)
				mod.toServer('C_PUT_WARE_ITEM', 3, { gameId: mod.game.me.gameId, container: event.container, offset: event.offset, fromPocket: toBank.pocket, fromSlot: toBank.slot, id: toBank.id, dbid: toBank.dbid, amount: toBank.amount, toSlot: event.offset })
		}
		mod.setTimeout(() => {
			if (!enabled) return
			if (event.offset + 72 < event.numUnlockedSlots) mod.toServer('C_VIEW_WARE', 2, { gameId: mod.game.me.gameId, type: event.container, offset: event.offset + 72 })
			else mod.toServer('C_CANCEL_CONTRACT', 1, { type: 26, id: curBankContractId })
		}, toBankItems.length * 47 + 150)
	}
	function cPutWareItem({ id }) {
		if (AddToBl) {
			if (blacklist.indexOf(id) === -1) {
				blacklist.push(id)
				Msg(`The item '${convToCLA(id)}' was <font color="#4DE19C">Added</font> to blacklist.`)
			}
			else Msg(`The item '${convToCLA(id)}' is Already blacklisted.`)
			return false
		}
		if (RmvFromBl) {
			const blItemIndex = blacklist.indexOf(id)
			if (blItemIndex !== -1) {
				blacklist.splice(blItemIndex, 1)
				Msg(`The item '${convToCLA(id)}' was <font color="#FE6F5E">Removed</font> from blacklist.`)
			}
			else Msg(`The item '${convToCLA(id)}' is Not blacklisted.`)
			return false
		}
	}
	function sRequestContract(event) { if (event.type === 26) curBankContractId = event.id }
	function sCancelContract(event) {
		if (event.type === 26) {
			curBankContractId = -1
			resetValues()
		}
	}
	//function sSytemMessage(event) { if (enabled && mod.parseSystemMessage(event.message).id === 'SMT_WAREHOUSE_FULL') return false }

	// ** Hooks ** \\

	mod.hook('S_VIEW_WARE_EX', 2, sViewWareEx)
	mod.hook('C_PUT_WARE_ITEM', 3, cPutWareItem)
	mod.hook('S_REQUEST_CONTRACT', 1, sRequestContract)
	mod.hook('S_CANCEL_CONTRACT', 1, sCancelContract)
	//mod.hook('S_SYSTEM_MESSAGE', 1, sSytemMessage)

	// ** Helper Functions ** \\

	function toUniqueDbidArr(a, b, c = {}) {
		b = a.length
		if (!b) return []
		while (b--)
			c[a[b].dbid] = a[b]
		return Object.values(c)
	}
	function remvBlacklisted(a, b, c = []) {
		b = a.length
		if (!b) return c
		while (b--)
			if (blacklist.indexOf(a[b].id) === -1) c.push(a[b])
		return c
	}
	function getLine(n, m = 1) {
		while (8 * m < n)
			m++
		return m
	}
	function convToCLA(id) {
		return `<font color="#7289DA"><ChatLinkAction param="1#####${id}">&lt;ID=${id}&gt;</ChatLinkAction></font>`
	}

	const Msg = msg => mod.command.message(`${NotCP ? '[Auto-Bank]' : ''} ${msg}`),
		resetValues = () => {
			if (AddToBl) toggleAddToBl()
			if (RmvFromBl) toggleRmvFromBl()
			if (QueuedMsgs.length) {
				Msg(`[Warning] <font color="#FE6F5E">Duplicate</font> items were found in your bank (page:line:slot).`)
				for (const msg of QueuedMsgs) Msg(`\t- ${msg}`)
			}
			if (enabled) Msg('Auto Banking is <font color="#FE6F5E">disabled</font>.')
			enabled = false
			QueuedMsgs.length = 0
			AllCurrentBankItems.length = 0
			AllCurrentBankItemsIds.length = 0
			lastBankedPageOffset = -1
		},
		saveBlacklistFile = () => fs.writeFileSync(fn, JSON.stringify(blacklist.sort((a, b) => a - b)), err => { ReadFile(); if (err) console.log(err) }),
		toggleAddToBl = () => {
			AddToBl = !AddToBl
			if (RmvFromBl && AddToBl) toggleRmvFromBl()
			Msg(`Adding to Blacklist <font color="#${AddToBl ? `4DE19C">En` : `FE6F5E">Dis`}abled</font>.`)
			if (!AddToBl) saveBlacklistFile()
		},
		toggleRmvFromBl = () => {
			RmvFromBl = !RmvFromBl
			if (RmvFromBl && AddToBl) toggleAddToBl()
			Msg(`Removing from Blacklist <font color="#${RmvFromBl ? `4DE19C">En` : `FE6F5E">Dis`}abled</font>.`)
			if (!RmvFromBl) saveBlacklistFile()
		}

	// ** Command ** \\

	mod.command.add(['autobank', 'ab'], (key) => {
		if (key) key = key.toLowerCase()
		switch (key) {
			case 'guild': case 'g':
				GuildBanking = !GuildBanking
				Msg(`Banking to Guild Bank is <font color="#${GuildBanking ? `4DE19C">En` : `FE6F5E">Dis`}abled</font>.`)
				break
			case 'blacklist': case 'bl':
				toggleAddToBl()
				break
			case 'rmblacklist': case 'rmvblacklist': case 'rmbl': case 'rmvbl':
				toggleRmvFromBl()
				break
			default:
				if (!enabled) {
					enabled = true
					Msg('Auto Banking is <font color="#4DE19C">enabled</font>.')
				}
				else resetValues()
				break
		}
	})
}