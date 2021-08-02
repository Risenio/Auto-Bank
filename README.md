# Auto-Bank
  A script that auto merges inventory items to bank if same item exists in bank/special storage/wardrobe/guild bank/etc.'s tab.

## Usage
  1. Use command `autobank`/`ab` to toggle banking.
  2. Open bank or click on bank tab to begin.
  3. That's it. It will automatically check all pages in the bank you've open, and once it ends, it will close the bank for you.

## Commands
  All commands start with `autobank` or `ab` as alternative.

  - `autobank` or `ab` + open storage space (bank/extra storage or wardrobe, etc) ~ Starts the auto-banking process.
  ---
  - `ab bl <add/rem/reset/clear>` ~ Manages blacklist.
    * `ab bl <add/+/-/remove>`:
      - There are 3 different ways to blacklist or unblacklist an item:
        1. Followed by writing the id of item(s), if more than one, use space as separation between each, e.g.
          > `ab bl add 1 2 3 4 5`<br>`ab bl rem 1 2 3 4 5`
        2. Followed by linked items (ctrl+left click), any amount of items, if more than one, spacing doesn't matter here (you may add space or not).
          > `ab bl ad <item1> <item2> <item3>`<br>`ab bl rm <item1> <item2> <item3>`
        3. If you omit arguments, it will enable (un)blacklisting;
          > `ab bl +` ~ Toggles blacklisting.<br>`ab bl rmv` ~ Toggles unblacklisting.
          - Open bank, then try add that item to bank to (un)blacklist it.
            * Note: Item will not be banked while this enabled.
        ---
        ○ Additionally; If you want to blacklist entire pocket tab, say you want to keep superior items there, don't want them to get banked at all, no matter if they exist in bank or blacklist or not, you can do that using: (case-insensitive)
          > `ab bl + pocket1 PocKet2 pocket3`<br>`ab bl - pocKET1 pocket2 pocket3`
    * `ab bl <reset/default>`:
      - This command resets the blacklist to the [default blacklist](#Blacklist).
    * `ab bl <clear/empty>`:
      - This will empty up the entire blacklist, to have 0 blacklisted items.
    * `ab bl list`:
      - Lists all the items that are currently blacklisted. (The items in blue are clickable links, you can click it to show the item.)
  ---
  - `autobank <guild/g>` toggles banking to guild bank. **Default Off**. 

## Blacklist
  If no `blacklist.json` file was found, it will be using the default blacklist.
  - Editing/modifying the blacklist using blacklisting commands will be saved into the `blacklist.json` file.
  - You can get the id of any item from [this site](https://teralore.com/en/).
  <details>
    <summary><b>Default blacklist</b></summary>
  
  - ID: 112     - [Rejuvenation Potion](https://teralore.com/en/item/112)
  - ID: 114     - [Valkyon Health Potion](https://teralore.com/en/item/114)
  - ID: 116     - [Health Potion](https://teralore.com/en/item/116)
  - ID: 194     - [Scroll of Rapid Resurrection](https://teralore.com/en/item/194)
  - ID: 130     - [Divine Infusion](https://teralore.com/en/item/130)
  - ID: 444     - [[Legacy] Bravery Potion](https://teralore.com/en/item/444)
  - ID: 6552    - [Prime Recovery Potable](https://teralore.com/en/item/6552)
  - ID: 6553    - [Superior Recovery Potable](https://teralore.com/en/item/6553)
  - ID: 6562    - [Prime Replenishment Potable](https://teralore.com/en/item/6562)
  - ID: 6563    - [Superior Replenishment Potable](https://teralore.com/en/item/6563)
  - ID: 9310    - [Veteran's HP Potion](https://teralore.com/en/item/9310)
  - ID: 9311    - [Veteran's MP Potion](https://teralore.com/en/item/9311)
  - ID: 60260   - [Goddess's Blessing](https://teralore.com/en/item/60260)
  - ID: 70000   - [Complete Crystalbind](https://teralore.com/en/item/70000)
  - ID: 80081   - [Lein's Dark Root Beer](https://teralore.com/en/item/80081)
  - ID: 80095   - [Federation Supply: Rejuvenation Potion](https://teralore.com/en/item/80095)
  - ID: 81209   - [Friendly Feast](https://teralore.com/en/item/81209)
  - ID: 150532  - [Strong Bravery Potion](https://teralore.com/en/item/150532)
  - ID: 150533  - [Strong Bravery Potion](https://teralore.com/en/item/150533)
  - ID: 150534  - [Strong Canephora Potion](https://teralore.com/en/item/150534)
  - ID: 150535  - [Strong Canephora Potion](https://teralore.com/en/item/150535)
  - ID: 150542  - [Bravery Potion](https://teralore.com/en/item/150542)
  - ID: 151643  - [Elleon's Mark of Valor](https://teralore.com/en/item/151643)
  - ID: 155324  - [Goddess's Blessing](https://teralore.com/en/item/155324)
  - ID: 160322  - [Goddess's Blessing](https://teralore.com/en/item/160322)
  - ID: 167001  - [Canephora Potion](https://teralore.com/en/item/167001)
  - ID: 177131  - [Pet Treat](https://teralore.com/en/item/177131)
  - ID: 177132  - [Pet Food](https://teralore.com/en/item/177132)
  - ID: 177133  - [Pet Snack](https://teralore.com/en/item/177133)
  - ID: 200529  - [Goddess's Blessing](https://teralore.com/en/item/200529)
  - ID: 200922  - [Superior Noctenium Elixir](https://teralore.com/en/item/200922)
  - ID: 200999  - [Prime Battle Solution](https://teralore.com/en/item/200999)
  - ID: 201957  - [Eren's Key](https://teralore.com/en/item/201957)
  - ID: 201958  - [Eren's Key](https://teralore.com/en/item/201958)
  - ID: 202015  - [Bravery Potion](https://teralore.com/en/item/202015)
  - ID: 206049  - [Puppy Figurine](https://teralore.com/en/item/206049)
  - ID: 206050  - [Piglet Figurine](https://teralore.com/en/item/206050)
  - ID: 206051  - [Popori Figurine](https://teralore.com/en/item/206051)
  </details>

## Capability
  * Should work on any proxy.
  * 1 dependency;
    - tera-game-state
      - If you're using Caali's proxy(toolbox), you don't have to do anything, as this comes along-with by default.
      - If you're using Pinkie's proxy, you will have to get it, via [this LINK](https://github.com/tera-mods-forks/tera-game-state) & place it in your mods folder (`[proxy dir]/mods/`).

## Additional information
  It will also send a warning if the same exact item is available in more than one page (i.e. Duplicate) in your storage space. (the warning will include a blue clickable links, you can click it to show the item).

  * FAQ<br>
    - ? It have banked an item for me, and now I can't withdraw it with "That item isn't in your bank" error.
      - A: This is unrelated to script, simply you have same item, but 2 different time remaining, so make sure you don't withdraw with quantity or by right clicking on wrong stack of that item.
    - ? It have banked all the way until full page and continued in next page.
    - ? It have banked same item in 2 different pages.
      - A: Its impossible, script will never bank an item in different page, even if page is full. (Make sure you don't already have that item in different pages, aka see duplication log).
    - ? It moved my items from pocket/inventory to other pockets or to inventory.
      - A: Its client behaviour, works only for ¹stacked items. If a stacked item has more amount in slot than the other slot, and you banked it; the less amount one will be moved from the 'other slot' to get in place of the banked one. ¹Unstackable items are unaffected.

## Proof of concept
  <details>

![img](https://i.imgur.com/Pq25apV.gif)
  </details>