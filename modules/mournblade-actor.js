/* -------------------------------------------- */
import { MournbladeUtility } from "./mournblade-utility.js";
import { MournbladeRollDialog } from "./mournblade-roll-dialog.js";

/* -------------------------------------------- */
const __degatsBonus = [-2, -2, -1, -1, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10]
const __vitesseBonus = [-2, -2, -1, -1, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8]

/* -------------------------------------------- */
/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MournbladeActor extends Actor {

  /* -------------------------------------------- */
  /**
   * Override the create() function to provide additional SoS functionality.
   *
   * This overrided create() function adds initial items 
   * Namely: Basic skills, money, 
   *
   * @param {Object} data        Barebones actor data which this function adds onto.
   * @param {Object} options     (Unused) Additional options which customize the creation workflow.
   *
   */

  static async create(data, options) {

    // Case of compendium global import
    if (data instanceof Array) {
      return super.create(data, options);
    }
    // If the created actor has items (only applicable to duplicated actors) bypass the new actor creation logic
    if (data.items) {
      let actor = super.create(data, options);
      return actor;
    }

    if (data.type == 'personnage') {
      const skills = await MournbladeUtility.loadCompendium("fvtt-mournblade.skills")
      data.items = skills.map(i => i.toObject())
    }
    if (data.type == 'pnj') {
    }

    return super.create(data, options);
  }

  /* -------------------------------------------- */
  prepareArme(arme) {
    arme = duplicate(arme)
    let combat = this.getCombatValues()
    if (arme.system.typearme == "contact" || arme.system.typearme == "contactjet") {
      arme.system.competence = duplicate(this.items.find(item => item.type == "competence" && item.name.toLowerCase() == "mêlée"))
      arme.system.attrKey = "pui"
      arme.system.totalDegats = arme.system.degats + "+" + combat.bonusDegatsTotal
      arme.system.totalOffensif = this.system.attributs.pui.value + arme.system.competence.system.niveau + arme.system.bonusmaniementoff
      if (arme.system.isdefense) {
        arme.system.totalDefensif = combat.defenseTotal + arme.system.competence.system.niveau + arme.system.bonusmaniementdef
      }
    }
    if (arme.system.typearme == "jet" || arme.system.typearme == "tir") {
      arme.system.competence = duplicate(this.items.find(item => item.type == "competence" && item.name.toLowerCase() == "armes à distance"))
      arme.system.attrKey = "adr"
      arme.system.totalOffensif = this.system.attributs.adr.value + arme.system.competence.system.niveau + arme.system.bonusmaniementoff
      arme.system.totalDegats = arme.system.degats
      if (arme.system.isdefense) {
        arme.system.totalDefensif = combat.defenseTotal + arme.system.competence.system.niveau + arme.system.bonusmaniementdef
      }
    }
    return arme
  }
  /* -------------------------------------------- */
  prepareBouclier(bouclier) {
    bouclier = duplicate(bouclier)
    let combat = this.getCombatValues()
    bouclier.system.competence = duplicate(this.items.find(item => item.type == "competence" && item.name.toLowerCase() == "mêlée"))
    bouclier.system.attrKey = "pui"
    bouclier.system.totalDegats = bouclier.system.degats + "+" + combat.bonusDegatsTotal
    bouclier.system.totalOffensif = this.system.attributs.pui.value + bouclier.system.competence.system.niveau
    bouclier.system.isdefense = true
    bouclier.system.bonusmaniementoff = 0
    bouclier.system.totalDefensif = combat.defenseTotal + bouclier.system.competence.system.niveau + bouclier.system.bonusdefense
    return bouclier
  }

  /* -------------------------------------------- */
  getWeapons() {
    let armes = []
    for (let arme of this.items) {
      if (arme.type == "arme") {
        armes.push(this.prepareArme(arme))
      }
      if (arme.type == "bouclier") {
        armes.push(this.prepareBouclier(arme))
      }
    }
    return armes
  }

  /* -------------------------------------------- */
  getDons() {
    return this.items.filter(item => item.type == "don")
  }
  /* -------------------------------------------- */
  getTendances() {
    return this.items.filter(item => item.type == "tendance")
  }
  getRunes() {
    return this.items.filter(item => item.type == "rune")
  }
  /* -------------------------------------------- */
  getEquipments() {
    return this.items.filter(item => item.type == "equipement")
  }
  /* -------------------------------------------- */
  getArmors() {
    return this.items.filter(item => item.type == "protection")
  }
  getOrigine() {
    return this.items.find(item => item.type == "origine")
  }
  getMetier() {
    return this.items.find(item => item.type == "metier")
  }
  getHeritage() {
    return this.items.find(item => item.type == "heritage")
  }
  /* -------------------------------------------- */
  getSkills() {
    let comp = []
    for (let item of this.items) {
      item = duplicate(item)
      if (item.type == "competence") {
        item.system.attribut1total = item.system.niveau + (this.system.attributs[item.system.attribut1]?.value || 0)
        item.system.attribut2total = item.system.niveau + (this.system.attributs[item.system.attribut2]?.value || 0)
        item.system.attribut3total = item.system.niveau + (this.system.attributs[item.system.attribut3]?.value || 0)
        if (item.system.niveau == 0) {
          item.system.attribut1total -= 3
          item.system.attribut2total -= 3
          item.system.attribut3total -= 3
        }
        item.system.attribut1label = this.system.attributs[item.system.attribut1]?.label || ""
        item.system.attribut2label = this.system.attributs[item.system.attribut2]?.label || ""
        item.system.attribut3label = this.system.attributs[item.system.attribut3]?.label || ""
        comp.push(item)
      }
    }
    return comp.sort(function (a, b) {
      let fa = a.name.toLowerCase(),
        fb = b.name.toLowerCase();
      if (fa < fb) {
        return -1;
      }
      if (fa > fb) {
        return 1;
      }
      return 0;
    })
  }

  /* -------------------------------------------- */
  getAspect() {
    return (this.system.balance.loi > this.system.balance.chaos) ? this.system.balance.loi : this.system.balance.chaos    
  }
  getMarge() {
    return Math.abs( this.system.balance.loi - this.system.balance.chaos)
  }
  getAlignement() {
    return (this.system.balance.loi > this.system.balance.chaos) ? "loyal" : "chaotique"
  }

  /* -------------------------------------------- */
  getDefenseBase() {
    return this.system.attributs.tre.value + 5
  }

  /* -------------------------------------------- */
  getVitesseBase() {
    return 5 + __vitesseBonus[this.system.attributs.adr.value]
  }

  /* -------------------------------------------- */
  getCombatValues() {
    let combat = {
      initBase: this.system.attributs.adr.value,
      initTotal: this.system.attributs.adr.value + this.system.combat.initbonus,
      bonusDegats: this.getBonusDegats(),
      bonusDegatsTotal: this.getBonusDegats() + this.system.combat.bonusdegats,
      vitesseBase: this.getVitesseBase(),
      vitesseTotal: this.getVitesseBase() + this.system.combat.vitessebonus,
      defenseBase: this.getDefenseBase(),
      defenseTotal: this.getDefenseBase() + this.system.combat.defensebonus
    }
    return combat
  }

  /* -------------------------------------------- */
  prepareBaseData() {
  }

  /* -------------------------------------------- */
  async prepareData() {
    super.prepareData();
  }

  /* -------------------------------------------- */
  prepareDerivedData() {

    if (this.type == 'personnage') {
      let newSante = this.system.sante.bonus + (this.system.attributs.pui.value + this.system.attributs.tre.value) * 2 + 5
      if (this.system.sante.base != newSante) {
        this.update({ 'system.sante.base': newSante })
      }
      let newAme = (this.system.attributs.cla.value + this.system.attributs.tre.value) * this.system.biodata.amemultiplier + 5
      if (this.system.ame.fullmax != newAme) {
        this.update({ 'system.ame.fullmax': newAme })
      }
    }

    super.prepareDerivedData()
  }

  /* -------------------------------------------- */
  _preUpdate(changed, options, user) {

    super._preUpdate(changed, options, user);
  }

  /* -------------------------------------------- */
  getItemById(id) {
    let item = this.items.find(item => item.id == id);
    if (item) {
      item = duplicate(item)
    }
    return item;
  }

  /* -------------------------------------------- */
  async equipItem(itemId) {
    let item = this.items.find(item => item.id == itemId)
    if (item && item.system) {
      let update = { _id: item.id, "system.equipped": !item.system.equipped }
      await this.updateEmbeddedDocuments('Item', [update]); // Updates one EmbeddedEntity
    }
  }

  /* -------------------------------------------- */
  editItemField(itemId, itemType, itemField, dataType, value) {
    let item = this.items.find(item => item.id == itemId)
    if (item) {
      console.log("Item ", item, itemField, dataType, value)
      if (dataType.toLowerCase() == "number") {
        value = Number(value)
      } else {
        value = String(value)
      }
      let update = { _id: item.id, [`system.${itemField}`]: value };
      this.updateEmbeddedDocuments("Item", [update])
    }
  }

  /* -------------------------------------------- */
  getBonneAventure() {
    return this.system.bonneaventure.actuelle
  }

  /* -------------------------------------------- */
  changeBonneAventure(value) {
    let newBA = this.system.bonneaventure.actuelle
    newBA += value
    this.update({ 'system.bonneaventure.actuelle': newBA })
  }

  /* -------------------------------------------- */
  getEclat() {
    return this.system.eclat.value
  }

  /* -------------------------------------------- */
  changeEclat(value) {
    let newE = this.system.eclat.value
    newE += value
    this.update({ 'system.eclat.value': newE })
  }

  /* -------------------------------------------- */
  canEclatDoubleD20() {
    return (this.getAlignement() == "loyal" && this.system.eclat.value > 0)
  }
  /* -------------------------------------------- */
  subPointsAme(runeMode, value) {
    let ame = duplicate(this.system.ame)
    if(runeMode == "prononcer") {
      ame.value -= value
    } else {
      ame.currentmax -= value
    }
    this.update( {'system.ame': ame})
  }

  /* -------------------------------------------- */
  compareName(a, b) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  /* -------------------------------------------- */
  getAttribute(attrKey) {
    return this.system.attributes[attrKey]
  }

  /* -------------------------------------------- */
  getBonusDegats() {
    return __degatsBonus[this.system.attributs.pui.value]
  }

  /* -------------------------------------------- */
  async equipGear(equipmentId) {
    let item = this.items.find(item => item.id == equipmentId);
    if (item && item.system.data) {
      let update = { _id: item.id, "system.equipped": !item.system.equipped };
      await this.updateEmbeddedDocuments('Item', [update]); // Updates one EmbeddedEntity
    }
  }

  /* -------------------------------------------- */
  getSubActors() {
    let subActors = [];
    for (let id of this.system.subactors) {
      subActors.push(duplicate(game.actors.get(id)));
    }
    return subActors;
  }
  /* -------------------------------------------- */
  async addSubActor(subActorId) {
    let subActors = duplicate(this.system.subactors);
    subActors.push(subActorId);
    await this.update({ 'system.subactors': subActors });
  }
  /* -------------------------------------------- */
  async delSubActor(subActorId) {
    let newArray = [];
    for (let id of this.system.subactors) {
      if (id != subActorId) {
        newArray.push(id);
      }
    }
    await this.update({ 'system.subactors': newArray });
  }

  /* -------------------------------------------- */
  async incDecQuantity(objetId, incDec = 0) {
    let objetQ = this.items.get(objetId)
    if (objetQ) {
      let newQ = objetQ.system.quantity + incDec;
      const updated = await this.updateEmbeddedDocuments('Item', [{ _id: objetQ.id, 'system.quantity': newQ }]); // pdates one EmbeddedEntity
    }
  }

  /* -------------------------------------------- */
  getCompetence(compId) {
    return this.items.get(compId)
  }

  /* -------------------------------------------- */
  async setPredilectionUsed(compId, predIdx) {
    let comp = this.items.get(compId)
    let pred = duplicate(comp.system.predilections)
    pred[predIdx].used = true
    await this.updateEmbeddedDocuments('Item', [{ _id: compId, 'system.predilections': pred }])
  }

  /* -------------------------------------------- */
  getInitiativeScore( ) {
    return Number(this.system.attributs.adr.value) + Number(this.system.combat.initbonus)
  }
  /* -------------------------------------------- */
  getBestDefenseValue() {
    let defenseList = this.items.filter(item => (item.type =="arme" || item.type == "bouclier") && item.system.equipped)
    let maxDef = 0
    let bestArme
    for(let arme of defenseList) {
      if (arme.type == "arme" && arme.system.isdefense) {
        arme = this.prepareArme(arme)
      }
      if (arme.type == "bouclier" ) {
        arme = this.prepareBouclier(arme)
      }
      if ( arme.system.totalDefensif > maxDef) {
        maxDef = arme.system.totalDefensif
        bestArme = duplicate(arme)
      }
    }
    return bestArme
  }

  /* -------------------------------------------- */
  getCommonRollData(attrKey = undefined, compId = undefined, compName = undefined) {
    let rollData = MournbladeUtility.getBasicRollData()
    rollData.alias = this.name
    rollData.actorImg = this.img
    rollData.actorId = this.id
    rollData.img = this.img
    rollData.canEclatDoubleD20 = this.canEclatDoubleD20()
    rollData.doubleD20 = false
    rollData.attributs = MournbladeUtility.getAttributs()

    if (attrKey) {
      rollData.attrKey = attrKey
      if (attrKey != "tochoose") {
        rollData.actionImg = "systems/fvtt-mournblade/assets/icons/" + this.system.attributs[attrKey].labelnorm + ".webp"
        rollData.attr = duplicate(this.system.attributs[attrKey])
      }
    }
    if (compId) {
      rollData.competence = duplicate(this.items.get(compId) || {})
      rollData.actionImg = rollData.competence?.img
    }
    if (compName) {
      rollData.competence = duplicate(this.items.find( item => item.name.toLowerCase() == compName.toLowerCase()) || {})
      rollData.actionImg = rollData.competence?.img
    }
    return rollData
  }

  /* -------------------------------------------- */
  async rollAttribut(attrKey) {
    let rollData = this.getCommonRollData(attrKey)
    console.log("RollDatra", rollData)
    let rollDialog = await MournbladeRollDialog.create(this, rollData)
    rollDialog.render(true)
  }

  /* -------------------------------------------- */
  async rollCompetence(attrKey, compId) {
    let rollData = this.getCommonRollData(attrKey, compId)
    console.log("RollDatra", rollData)
    let rollDialog = await MournbladeRollDialog.create(this, rollData)
    rollDialog.render(true)
  }

  /* -------------------------------------------- */
  async rollRune(runeId) {    
    let comp = this.items.find(comp => comp.type == "competence" && comp.name.toLowerCase() == "savoir : runes")
    if ( !comp) {
      ui.notifications.warn("La compétence Savoirs : Runes n'a pas été trouvée, abandon.")
      return
    }
    let rollData = this.getCommonRollData("cla", undefined, "Savoir : Runes")
    rollData.rune =  duplicate(this.items.get(runeId) || {})
    rollData.difficulte = rollData.rune?.system?.seuil || 0
    rollData.runemode = "prononcer"
    rollData.runeame  = 1
    console.log("runeData", rollData)
    let rollDialog = await MournbladeRollDialog.create(this, rollData)
    rollDialog.render(true)
  }
  
  /* -------------------------------------------- */
  async rollArmeOffensif(armeId) {
    let arme = this.items.get(armeId)
    if (arme.type == "arme") {
      arme = this.prepareArme(arme)
    }
    if (arme.type == "bouclier") {
      arme = this.prepareBouclier(arme)
    }
    let rollData = this.getCommonRollData(arme.system.attrKey, arme.system.competence._id)
    rollData.arme = arme
    console.log("ARME!", rollData)
    let rollDialog = await MournbladeRollDialog.create(this, rollData)
    rollDialog.render(true)
  }

  /* -------------------------------------------- */
  async rollArmeDegats(armeId) {
    let arme = this.items.get(armeId)
    if (arme.type == "arme") {
      arme = this.prepareArme(arme)
    }
    if (arme.type == "bouclier") {
      arme = this.prepareBouclier(arme)
    }
    let roll = new Roll(arme.system.totalDegats).roll({ async: false })
    await MournbladeUtility.showDiceSoNice(roll, game.settings.get("core", "rollMode"));
    let rollData = {
      arme: arme,
      finalResult: roll.total,
      alias: this.name,
      actorImg: this.img,
      actorId: this.id,
      actionImg: arme.img,
    }
    MournbladeUtility.createChatWithRollMode(rollData.alias, {
      content: await renderTemplate(`systems/fvtt-mournblade/templates/chat-degats-result.html`, rollData)
    })

  }
}
