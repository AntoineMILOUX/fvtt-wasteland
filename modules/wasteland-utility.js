/* -------------------------------------------- */
import { WastelandCombat } from "./wasteland-combat.js";
import { WastelandCommands } from "./wasteland-commands.js";

/* -------------------------------------------- */
export class WastelandUtility {


  /* -------------------------------------------- */
  static async init() {
    Hooks.on('renderChatLog', (log, html, data) => WastelandUtility.chatListeners(html))
    Hooks.on("getChatLogEntryContext", (html, options) => WastelandUtility.chatRollMenu(html, options))

    Hooks.on("getCombatTrackerEntryContext", (html, options) => {
      WastelandUtility.pushInitiativeOptions(html, options);
    })
    Hooks.on("dropCanvasData", (canvas, data) => {
      WastelandUtility.dropItemOnToken(canvas, data)
    });

    this.rollDataStore = {}
    this.defenderStore = {}
    WastelandCommands.init();

    Handlebars.registerHelper('count', function (list) {
      return list.length;
    })
    Handlebars.registerHelper('includes', function (array, val) {
      return array.includes(val);
    })
    Handlebars.registerHelper('upper', function (text) {
      return text.toUpperCase();
    })
    Handlebars.registerHelper('lower', function (text) {
      return text.toLowerCase()
    })
    Handlebars.registerHelper('upperFirst', function (text) {
      if (typeof text !== 'string') return text
      return text.charAt(0).toUpperCase() + text.slice(1)
    })
    Handlebars.registerHelper('notEmpty', function (list) {
      return list.length > 0;
    })
    Handlebars.registerHelper('mul', function (a, b) {
      return parseInt(a) * parseInt(b);
    })

  }

  /* -------------------------------------------- */
  static getModificateurOptions() {
    let opt = []
    for (let i = -15; i <= 15; i++) {
      opt.push(`<option value="${i}">${i}</option>`)
    }
    return opt.concat("\n")
  }

  /* -------------------------------------------- */
  static getPointAmeOptions() {
    let opt = []
    for (let i = 1; i <= 20; i++) {
      opt.push(`<option value="${i}">${i}</option>`)
    }
    return opt.concat("\n")
  }

  /* -------------------------------------------- */
  static getAttributs() {
    return { adr: "Adresse", pui: "Puissance", cla: "Clairvoyance", pre: "Présence", tre: "Trempe" }
  }
  /* -------------------------------------------- */
  static pushInitiativeOptions(html, options) {
  }

  /* -------------------------------------------- */
  static getSkills() {
    return this.skills
  }

  /* -------------------------------------------- */
  static async ready() {
    const skills = await WastelandUtility.loadCompendium("fvtt-wasteland.skills")
    this.skills = skills.map(i => i.toObject())
  }

  /* -------------------------------------------- */
  static async loadCompendiumData(compendium) {
    const pack = game.packs.get(compendium);
    return await pack?.getDocuments() ?? [];
  }

  /* -------------------------------------------- */
  static async loadCompendium(compendium, filter = item => true) {
    let compendiumData = await WastelandUtility.loadCompendiumData(compendium);
    return compendiumData.filter(filter);
  }

  /* -------------------------------------------- */
  static getOptionsStatusList() {
    return this.optionsStatusList;
  }
  /* -------------------------------------------- */
  static async chatListeners(html) {

    html.on("click", '.predilection-reroll', async event => {
      let predIdx = $(event.currentTarget).data("predilection-index")
      let messageId = WastelandUtility.findChatMessageId(event.currentTarget)
      let message = game.messages.get(messageId)
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      await actor.setPredilectionUsed(rollData.competence._id, predIdx)
      rollData.competence = duplicate(actor.getCompetence(rollData.competence._id))
      WastelandUtility.rollWasteland(rollData)
    })
  }

  /* -------------------------------------------- */
  static async preloadHandlebarsTemplates() {

    const templatePaths = [
      'systems/fvtt-wasteland/templates/editor-notes-gm.html',
      'systems/fvtt-wasteland/templates/partial-item-description.html',
      'systems/fvtt-wasteland/templates/partial-list-niveau.html'
    ]
    return loadTemplates(templatePaths);
  }

  /* -------------------------------------------- */
  static removeChatMessageId(messageId) {
    if (messageId) {
      game.messages.get(messageId)?.delete();
    }
  }

  static findChatMessageId(current) {
    return WastelandUtility.getChatMessageId(WastelandUtility.findChatMessage(current));
  }

  static getChatMessageId(node) {
    return node?.attributes.getNamedItem('data-message-id')?.value;
  }

  static findChatMessage(current) {
    return WastelandUtility.findNodeMatching(current, it => it.classList.contains('chat-message') && it.attributes.getNamedItem('data-message-id'))
  }

  static findNodeMatching(current, predicate) {
    if (current) {
      if (predicate(current)) {
        return current;
      }
      return WastelandUtility.findNodeMatching(current.parentElement, predicate);
    }
    return undefined;
  }

  /* -------------------------------------------- */
  static createDirectOptionList(min, max) {
    let options = {};
    for (let i = min; i <= max; i++) {
      options[`${i}`] = `${i}`;
    }
    return options;
  }

  /* -------------------------------------------- */
  static buildListOptions(min, max) {
    let options = ""
    for (let i = min; i <= max; i++) {
      options += `<option value="${i}">${i}</option>`
    }
    return options;
  }

  /* -------------------------------------------- */
  static getTarget() {
    if (game.user.targets && game.user.targets.size == 1) {
      for (let target of game.user.targets) {
        return target;
      }
    }
    return undefined;
  }

  /* -------------------------------------------- */
  static getDefenseState(actorId) {
    return this.defenderStore[actorId];
  }

  /* -------------------------------------------- */
  static updateRollData(rollData) {

    let id = rollData.rollId;
    let oldRollData = this.rollDataStore[id] || {};
    let newRollData = mergeObject(oldRollData, rollData);
    this.rollDataStore[id] = newRollData;
  }
  /* -------------------------------------------- */
  static saveRollData(rollData) {
    game.socket.emit("system.fvtt-wasteland", {
      name: "msg_update_roll", data: rollData
    }); // Notify all other clients of the roll    
    this.updateRollData(rollData);
  }

  /* -------------------------------------------- */
  static getRollData(id) {
    return this.rollDataStore[id];
  }

  /* -------------------------------------------- */
  static onSocketMesssage(msg) {
    //console.log("SOCKET MESSAGE", msg.name, game.user.character.id, msg.data.defenderId);
    if (msg.name == "msg_update_defense_state") {
      this.updateDefenseState(msg.data.defenderId, msg.data.rollId);
    }
    if (msg.name == "msg_update_roll") {
      this.updateRollData(msg.data);
    }
  }

  /* -------------------------------------------- */
  static chatDataSetup(content, modeOverride, isRoll = false, forceWhisper) {
    let chatData = {
      user: game.user.id,
      rollMode: modeOverride || game.settings.get("core", "rollMode"),
      content: content
    };

    if (["gmroll", "blindroll"].includes(chatData.rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    if (chatData.rollMode === "blindroll") chatData["blind"] = true;
    else if (chatData.rollMode === "selfroll") chatData["whisper"] = [game.user];

    if (forceWhisper) { // Final force !
      chatData["speaker"] = ChatMessage.getSpeaker();
      chatData["whisper"] = ChatMessage.getWhisperRecipients(forceWhisper);
    }

    return chatData;
  }

  /* -------------------------------------------- */
  static async showDiceSoNice(roll, rollMode) {
    if (game.modules.get("dice-so-nice")?.active) {
      if (game.dice3d) {
        let whisper = null;
        let blind = false;
        rollMode = rollMode ?? game.settings.get("core", "rollMode");
        switch (rollMode) {
          case "blindroll": //GM only
            blind = true;
          case "gmroll": //GM + rolling player
            whisper = this.getUsers(user => user.isGM);
            break;
          case "roll": //everybody
            whisper = this.getUsers(user => user.active);
            break;
          case "selfroll":
            whisper = [game.user.id];
            break;
        }
        await game.dice3d.showForRoll(roll, game.user, true, whisper, blind);
      }
    }
  }

  /* -------------------------------------------- */
  static computeResult(rollData) {
    if (rollData.mainDice == "1d20") {
      let diceValue = rollData.roll.terms[0].results[0].result
      diceValue *= (rollData.doubleD20) ? 2 : 1
      //console.log("PAIR/IMP", diceValue)
      if (diceValue % 2 == 1) {
        //console.log("PAIR/IMP2", diceValue)
        rollData.finalResult -= rollData.roll.terms[0].results[0].result // Substract value
        if (diceValue == 1 || diceValue == 11) {
          rollData.isDramatique = true
          rollData.isSuccess = false
        }
      }
    }

    //console.log("Result : ", rollData)
    if (rollData.difficulte > 0 && !rollData.isDramatique) {
      rollData.isSuccess = (rollData.finalResult >= rollData.difficulte)
      rollData.isHeroique = ((rollData.finalResult - rollData.difficulte) >= 10)
      rollData.isDramatique = ((rollData.finalResult - rollData.difficulte) <= -10)
    }
  }

  /* -------------------------------------------- */
  static async rollWasteland(rollData) {

    let actor = game.actors.get(rollData.actorId)
    if (rollData.attrKey == "tochoose") { // No attr selected, force address
      rollData.attrKey = "adr"
    }
    if (!rollData.attr) {
      rollData.actionImg = "systems/fvtt-wasteland/assets/icons/" + actor.system.attributs[rollData.attrKey].labelnorm + ".webp"
      rollData.attr = duplicate(actor.system.attributs[rollData.attrKey])
    }

    rollData.diceFormula = rollData.mainDice
    if (rollData.doubleD20) { // Multiply result !
      rollData.diceFormula += "*2"
      if (!rollData.isReroll) {
        actor.changeEclat(-1)
      }
    }
    //console.log("BEFORE COMP", rollData)
    if (rollData.competence) {
      rollData.predilections = duplicate(rollData.competence.system.predilections.filter(pred => !pred.used) || [])
      let compmod = (rollData.competence.system.niveau == 0) ? -3 : 0
      rollData.diceFormula += `+${rollData.attr.value}+${rollData.competence.system.niveau}+${rollData.modificateur}+${compmod}`
    } else {
      rollData.diceFormula += `+${rollData.attr.value}*2+${rollData.modificateur}`
    }

    if (rollData.arme && rollData.arme.type == "arme") {
      rollData.diceFormula += `+${rollData.arme.system.bonusmaniementoff}`
    }

    if (rollData.rune) {
      rollData.runeduree = Math.ceil((rollData.runeame + 3) / 3)
      if (rollData.runemode == "inscrire") {
        rollData.runeduree *= 2
      }
      if (rollData.runemode == "prononcer") {
        rollData.runeduree = 1
      }
    }

    let myRoll = new Roll(rollData.diceFormula).roll({ async: false })
    await this.showDiceSoNice(myRoll, game.settings.get("core", "rollMode"))
    rollData.roll = myRoll
    console.log(">>>> ", myRoll)

    rollData.finalResult = myRoll.total
    this.computeResult(rollData)

    if (rollData.rune) {
      let subAme = rollData.runeame
      if (rollData.isEchec && !rollData.isDramatique) {
        subAme = Math.ceil((subAme + 1) / 2)
      }
      actor.subPointsAme(rollData.runemode, subAme)
    }

    this.createChatWithRollMode(rollData.alias, {
      content: await renderTemplate(`systems/fvtt-wasteland/templates/chat-generic-result.html`, rollData)
    }, rollData)

  }

  /* -------------------------------------------- */
  static async bonusRollWasteland(rollData) {
    rollData.bonusFormula = rollData.addedBonus

    let bonusRoll = new Roll(rollData.bonusFormula).roll({ async: false })
    await this.showDiceSoNice(bonusRoll, game.settings.get("core", "rollMode"));
    rollData.bonusRoll = bonusRoll

    rollData.finalResult += rollData.bonusRoll.total

    this.computeResult(rollData)

    this.createChatWithRollMode(rollData.alias, {
      content: await renderTemplate(`systems/fvtt-wasteland/templates/chat-generic-result.html`, rollData)
    }, rollData)

  }

  /* -------------------------------------------- */
  static getUsers(filter) {
    return game.users.filter(filter).map(user => user.data._id);
  }

  /* -------------------------------------------- */
  static getWhisperRecipients(rollMode, name) {
    switch (rollMode) {
      case "blindroll": return this.getUsers(user => user.isGM);
      case "gmroll": return this.getWhisperRecipientsAndGMs(name);
      case "selfroll": return [game.user.id];
    }
    return undefined;
  }
  /* -------------------------------------------- */
  static getWhisperRecipientsAndGMs(name) {
    let recep1 = ChatMessage.getWhisperRecipients(name) || [];
    return recep1.concat(ChatMessage.getWhisperRecipients('GM'));
  }

  /* -------------------------------------------- */
  static blindMessageToGM(chatOptions) {
    let chatGM = duplicate(chatOptions);
    chatGM.whisper = this.getUsers(user => user.isGM);
    chatGM.content = "Blinde message of " + game.user.name + "<br>" + chatOptions.content;
    console.log("blindMessageToGM", chatGM);
    game.socket.emit("system.fvtt-weapons-of-the-gods", { msg: "msg_gm_chat_message", data: chatGM });
  }

  /* -------------------------------------------- */
  static async searchItem(dataItem) {
    let item;
    if (dataItem.pack) {
      item = await fromUuid("Compendium." + dataItem.pack + "." + dataItem.id);
    } else {
      item = game.items.get(dataItem.id)
    }
    return item
  }

  /* -------------------------------------------- */
  static split3Columns(data) {

    let array = [[], [], []];
    if (data == undefined) return array;

    let col = 0;
    for (let key in data) {
      let keyword = data[key];
      keyword.key = key; // Self-reference
      array[col].push(keyword);
      col++;
      if (col == 3) col = 0;
    }
    return array;
  }

  /* -------------------------------------------- */
  static async createChatMessage(name, rollMode, chatOptions, rollData = undefined) {
    switch (rollMode) {
      case "blindroll": // GM only
        if (!game.user.isGM) {
          this.blindMessageToGM(chatOptions);

          chatOptions.whisper = [game.user.id];
          chatOptions.content = "Message only to the GM";
        }
        else {
          chatOptions.whisper = this.getUsers(user => user.isGM);
        }
        break;
      default:
        chatOptions.whisper = this.getWhisperRecipients(rollMode, name);
        break;
    }
    chatOptions.alias = chatOptions.alias || name
    let msg = await ChatMessage.create(chatOptions)
    console.log("=======>", rollData)
    msg.setFlag("world", "wasteland-roll", rollData)
  }

  /* -------------------------------------------- */
  static getBasicRollData() {
    let rollData = {
      rollId: randomID(16),
      rollMode: game.settings.get("core", "rollMode"),
      modificateursOptions: this.getModificateurOptions(),
      pointAmeOptions: this.getPointAmeOptions(),
      difficulte: 0,
      modificateur: 0,
    }
    WastelandUtility.updateWithTarget(rollData)
    return rollData
  }

  /* -------------------------------------------- */
  static updateWithTarget(rollData) {
    let target = WastelandUtility.getTarget()
    if (target) {
      rollData.defenderTokenId = target.id
      let defender = game.canvas.tokens.get(rollData.defenderTokenId).actor
      rollData.armeDefense = defender.getBestDefenseValue()
      if ( rollData.armeDefense)  {
        rollData.difficulte = rollData.armeDefense.system.totalDefensif
      } else {
        ui.notifications.warn("Aucune arme de défense équipée, difficulté manuelle à positionner.")
      }
    }
  }

  /* -------------------------------------------- */
  static createChatWithRollMode(name, chatOptions, rollData = undefined) {
    this.createChatMessage(name, game.settings.get("core", "rollMode"), chatOptions, rollData)
  }

  /* -------------------------------------------- */
  static applyBonneAventureRoll(li, changed, addedBonus) {
    let msgId = li.data("message-id")
    let msg = game.messages.get(msgId)
    if (msg) {
      let rollData = msg.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      actor.changeBonneAventure(changed)
      rollData.isReroll = true
      rollData.textBonus = "Bonus de Points d'Aventure"
      if (addedBonus == "reroll") {
        WastelandUtility.rollWasteland(rollData)
      } else {
        rollData.addedBonus = addedBonus
        WastelandUtility.bonusRollWasteland(rollData)
      }
    }
  }

  /* -------------------------------------------- */
  static applyEclatRoll(li, changed, addedBonus) {
    let msgId = li.data("message-id")
    let msg = game.messages.get(msgId)
    if (msg) {
      let rollData = msg.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      actor.changeEclat(changed)
      rollData.isReroll = true
      rollData.textBonus = "Bonus d'Eclat"
      rollData.addedBonus = addedBonus
      WastelandUtility.bonusRollWasteland(rollData)
    }
  }

  /* -------------------------------------------- */
  static chatRollMenu(html, options) {
    let canApply = li => canvas.tokens.controlled.length && li.find(".wasteland-roll").length
    let canApplyBALoyal = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      return (!rollData.isReroll && actor.getBonneAventure() > 0 && actor.getAlignement() == "loyal")
    }
    let canApplyPELoyal = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      return (!rollData.isReroll && actor.getEclat() > 0 && actor.getAlignement() == "loyal")
    }
    let canApplyBAChaotique = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      return (!rollData.isReroll && actor.getBonneAventure() > 0 && actor.getAlignement() == "chaotique")
    }
    let canApplyBAChaotique3 = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      return (!rollData.isReroll && actor.getBonneAventure() > 2 && actor.getAlignement() == "chaotique")
    }
    let canApplyPEChaotique = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      return (!rollData.isReroll && actor.getEclat() > 0 && actor.getAlignement() == "chaotique")
    }
    let hasPredilection = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      if (rollData.competence) {
        let nbPred = rollData.competence.data.predilections.filter(pred => !pred.used).length
        return (!rollData.isReroll && rollData.competence && nbPred > 0)
      }
      return false
    }
    let canCompetenceDouble = function (li) {
      let message = game.messages.get(li.attr("data-message-id"))
      let rollData = message.getFlag("world", "wasteland-roll")
      let actor = game.actors.get(rollData.actorId)
      if (rollData.competence) {
        return rollData.competence.data.doublebonus
      }
      return false
    }
    options.push(
      {
        name: "Ajouer +3 (1 point de Bonne Aventure)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyBALoyal,
        callback: li => WastelandUtility.applyBonneAventureRoll(li, -1, "+3")
      }
    )
    options.push(
      {
        name: "Ajouer +6 (1 point de Bonne Aventure)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyBALoyal && canCompetenceDouble,
        callback: li => WastelandUtility.applyBonneAventureRoll(li, -1, "+6")
      }
    )
    options.push(
      {
        name: "Ajouer +1d6 (1 point de Bonne Aventure)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyBAChaotique,
        callback: li => WastelandUtility.applyBonneAventureRoll(li, -1, "+1d6")
      }
    )
    options.push(
      {
        name: "Ajouer +2d6 (1 point de Bonne Aventure)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyBAChaotique && canCompetenceDouble,
        callback: li => WastelandUtility.applyBonneAventureRoll(li, -1, "+2d6")
      }
    )
    options.push(
      {
        name: "Relancer le dé (3 points de Bonne Aventure)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyBAChaotique3,
        callback: li => WastelandUtility.applyBonneAventureRoll(li, -3, "reroll")
      }
    )
    options.push(
      {
        name: "Ajouter +10 (1 Point d'Eclat)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyPELoyal,
        callback: li => WastelandUtility.applyEclatRoll(li, -1, "+10")
      }
    )
    options.push(
      {
        name: "Ajouter +20 (1 Point d'Eclat)",
        icon: "<i class='fas fa-user-plus'></i>",
        condition: canApply && canApplyPELoyal && canCompetenceDouble,
        callback: li => WastelandUtility.applyEclatRoll(li, -1, "+20")
      }
    )
    return options
  }

  /* -------------------------------------------- */
  static async confirmDelete(actorSheet, li) {
    let itemId = li.data("item-id");
    let msgTxt = "<p>Are you sure to remove this Item ?";
    let buttons = {
      delete: {
        icon: '<i class="fas fa-check"></i>',
        label: "Yes, remove it",
        callback: () => {
          actorSheet.actor.deleteEmbeddedDocuments("Item", [itemId]);
          li.slideUp(200, () => actorSheet.render(false));
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel"
      }
    }
    msgTxt += "</p>";
    let d = new Dialog({
      title: "Confirm removal",
      content: msgTxt,
      buttons: buttons,
      default: "cancel"
    });
    d.render(true);
  }

}