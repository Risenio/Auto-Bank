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
	const defs = { cPutWareItem: 3, sViewWareEx: mod.majorPatchVersion < 96 ? 2 : 3 }

	if (NotCP) {
		defs.cPutWareItem = mod.compileProto('uint64 gameId\nint32 container\nint32 offset\nint64 money\nint32 fromPocket\nint32 fromSlot\nint32 id\nuint64 dbid\nint32 amount\nint32 toSlot')
		defs.sViewWareEx = mod.compileProto('array items\n- array<int32> crystals\n- int32 id\n- uint64 dbid\n- uint64 ownerId\n- int32 container\n- int32 pocket\n- uint32 slot\n- int32 amountTotal\n- int32 amount\n- int32 enchant\n- int32 durability\n- bool soulbound\n- uint32 unk\n- bool masterwork\n- int32 enigma\n- int32 enchantAdvantage\n- int32 enchantBonus\n- int32 enchantBonusMaxPlus\n- bool awakened\n- int32 liberationStatus\n- int64 availableUntil ^96\nuint64 gameId\nint32 container\nint32 action\nint32 offset\nint32 maxUsedSlot\nint32 numUsedSlots\nint64 money\nint16 numUnlockedSlots')
	}

	// ** Initialize dependency ** \\
	mod.game.initialize('inventory')

	// ** Variables ** \\

	let enabled = false,
		GuildBanking = false,
		AddToBl = false,
		RmvFromBl = false,
		curBankContractId = -1,
		lastBankedPageOffset = -1,
		warningStack = -1,
		QueuedDups = new Map(),
		AllCurBankItems = new Map()

	// ** Hook Functions ** \\

	function sViewWareEx(event) {
		if (!enabled) return
		if (lastBankedPageOffset >= event.offset) return false
		if (!GuildBanking && event.container === 3) return Msg('Banking to guild bank is <font color="#FE6F5E">disabled</font>.')
		let toBankItems = []
		if (event.items.length > 0 && mod.game.inventory.items.length > 0) {
			lastBankedPageOffset = event.offset
			for (const bankItem of event.items) {
				{
					if (AllCurBankItems.has(bankItem.id)) {
						const dupItem = AllCurBankItems.get(bankItem.id)
						if (dupItem.offset !== event.offset)
							QueuedDups.has(dupItem.id) ?
								QueuedDups.get(dupItem.id).count++ :
								QueuedDups.set(dupItem.id, { count: 1, link: convToCLA(dupItem.id), details1: getDetails(dupItem.offset, dupItem.slot), details2: getDetails(event.offset, bankItem.slot) })
					} else AllCurBankItems.set(bankItem.id, { offset: event.offset, id: bankItem.id, slot: bankItem.slot })
				}
				const found = mod.game.inventory.findAllInBagOrPockets(bankItem.id)
				if (found && found.length)
					toBankItems.push(...found)
			}
			toBankItems = toUniqueDbidArr(toBankItems)
			toBankItems = remvBlacklisted(toBankItems)
			for (const toBank of toBankItems)
				mod.toServer('C_PUT_WARE_ITEM', defs.cPutWareItem, { gameId: mod.game.me.gameId, container: event.container, offset: event.offset, fromPocket: toBank.pocket, fromSlot: toBank.slot, id: toBank.id, dbid: toBank.dbid, amount: toBank.amount, toSlot: event.offset })
		}
		mod.setTimeout(() => {
			if (!enabled) return
			if (event.offset + 72 < event.numUnlockedSlots) mod.toServer('C_VIEW_WARE', 2, { gameId: mod.game.me.gameId, type: event.container, offset: event.offset + 72 })
			else mod.toServer('C_CANCEL_CONTRACT', 1, { type: 26, id: curBankContractId })
		}, toBankItems.length * 47 + 150)
	}
	function cPutWareItem({ id }) {
		if (AddToBl) {
			addToBl(id)
			return false
		}
		if (RmvFromBl) {
			rmvFromBl(id)
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

	mod.hook('S_VIEW_WARE_EX', defs.sViewWareEx, sViewWareEx)
	mod.hook('C_PUT_WARE_ITEM', defs.cPutWareItem, cPutWareItem)
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
	function getDetails(a, b, s = 0) {
		s = b - a + 1
		return `${a / 72 + 1}:${getLine(s)}:${s % 8 || 8}`
	}
	function convToCLA(id) {
		return `<font color="#7289DA"><ChatLinkAction param="1#####${id}">&lt;Click Me&gt;</ChatLinkAction></font>`
	}
	function validIdOrCLA(str, res = []) {
		const [...match] = str.matchAll(/<ChatLinkAction.+?1#####([0-9]+).*?<\/ChatLinkAction>|(^[0-9]+|\s[0-9]+|[0-9]+\s)/gm)
		for (const m of match) res.push(Number.parseInt(m[1] || m[2]))
		return res
	}

	const Msg = msg => mod.command.message(`${NotCP ? '[Auto-Bank]' : ''} ${msg}`),
		resetValues = () => {
			if (AddToBl) toggleAddToBl()
			if (RmvFromBl) toggleRmvFromBl()
			if (QueuedDups.size && warningStack !== QueuedDups.size) {
				warningStack = QueuedDups.size
				Msg(`[Warning] <font color="#FE6F5E">Duplicate</font> items were found in your bank (page:line:slot).`)
				if (QueuedDups.size < 50)
					for (const d of QueuedDups.values())
						Msg(`- ${d.count}x${d.link} | (${d.details1}) & (${d.details2})`)
				else Msg(`Over 50 items; won't be listed to prevent spam.`)
			}
			if (enabled) Msg('Auto Banking is <font color="#FE6F5E">disabled</font>.')
			enabled = false
			QueuedDups.clear()
			AllCurBankItems.clear()
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
		},
		addToBl = (...ids) => {
			const str = ids.join(' '), res = validIdOrCLA(str)
			if (!res.length) return Msg(`The argument(s) <font color="#FE6F5E">doesn't contain</font> valid id/itemLink to be blacklisted.\nGiven: '${str}'`)
			for (const id of res)
				if (blacklist.indexOf(id) === -1) {
					blacklist.push(id)
					Msg(`The item ${convToCLA(id)} was <font color="#4DE19C">Added</font> to blacklist.`)
				}
				else Msg(`The item ${convToCLA(id)} is <font color="#AB58F4">Already</font> blacklisted.`)
			saveBlacklistFile()
		},
		rmvFromBl = (...ids) => {
			const str = ids.join(' '), res = validIdOrCLA(str)
			if (!res.length) return Msg(`The argument(s) <font color="#FE6F5E">doesn't contain</font> valid id/itemLink to be unblacklisted.\nGiven: '${str}'`)
			for (const id of res) {
				const blItemIndex = blacklist.indexOf(id)
				if (blItemIndex !== -1) {
					blacklist.splice(blItemIndex, 1)
					Msg(`The item ${convToCLA(id)} was <font color="#FE6F5E">Removed</font> from blacklist.`)
				}
				else Msg(`The item ${convToCLA(id)} is <font color="#AB58F4">Not</font> blacklisted.`)
			}
			saveBlacklistFile()
		}

	// ** Command ** \\

	mod.command.add(['autobank', 'ab'], (key, arg, ...args) => {
		if (key) key = key.toLowerCase()
		if (arg) arg = arg.toLowerCase()
		switch (key) {
			case 'guild': case 'g':
				GuildBanking = !GuildBanking
				Msg(`Banking to Guild Bank is <font color="#${GuildBanking ? `4DE19C">En` : `FE6F5E">Dis`}abled</font>.`)
				break
			case 'blacklist': case 'bl':
				switch (arg) {
					case 'add': case '+':
						if (!args.length) toggleAddToBl()
						else addToBl(...args)
						break
					case 'remove': case 'rem': case 'rm': case '-':
						if (!args.length) toggleRmvFromBl()
						else rmvFromBl(...args)
						break
					case 'reset': case 'default':
						blacklist = defaultBl
						saveBlacklistFile()
						Msg(`Blacklist has been reset to default.`)
						break
					case 'clear': case 'empty':
						blacklist = []
						saveBlacklistFile()
						Msg(`Blacklist has been cleared.`)
						break
					case 'list':
						let bll = blacklist.length
						Msg(`Blacklist has ${bll} items.`)
						while (bll--)
							Msg(`\t- ${convToCLA(blacklist[bll])}`)
						break
					default:
						Msg('Invalid blacklist command, please refer to the readme.')
						break
				}
				break
			case 'rmblacklist': case 'rmvblacklist': case 'rmbl': case 'rmvbl':
				Msg('<font color="#FE6F5E">Deprecated command</font>, please use `<font color="#AB58F4">ab bl rem \<items?...\></font>` instead!')
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