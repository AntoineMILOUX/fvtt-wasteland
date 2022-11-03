/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { WastelandUtility } from "./wasteland-utility.js";
import { WastelandRollDialog } from "./wasteland-roll-dialog.js";

/* -------------------------------------------- */
export class WastelandActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ["fvtt-wasteland", "sheet", "actor"],
      template: "systems/fvtt-wasteland/templates/actor-sheet.html",
      width: 640,
      height: 720,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "competences" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      editScore: false
    });
  }

  /* -------------------------------------------- */
  async getData() {
    const objectData = duplicate(this.object)    
    let actorData = objectData 

    let formData = {
      title: this.title,
      id: objectData.id,
      type: objectData.type,
      img: objectData.img,
      name: objectData.name,
      editable: this.isEditable,
      cssClass: this.isEditable ? "editable" : "locked",
      data: actorData.system,
      effects: this.object.effects.map(e => foundry.utils.deepClone(e.data)),
      limited: this.object.limited,
      skills: this.actor.getSkills(),
      savoirs : this.actor.getSavoirs(),
      armes: duplicate(this.actor.getWeapons()),
      protections: duplicate(this.actor.getArmors()),
      dons: duplicate(this.actor.getDons()),
      alignement: this.actor.getAlignement(),
      aspect: this.actor.getAspect(),
      marge: this.actor.getMarge(),
      tendances:duplicate(this.actor.getTendances()),
      runes:duplicate(this.actor.getRunes()),
      origine: duplicate(this.actor.getOrigine() || {}),
      heritage: duplicate(this.actor.getHeritage() || {}),
      metier: duplicate(this.actor.getMetier()  || {}),
      combat: this.actor.getCombatValues(),      
      equipements: duplicate(this.actor.getEquipments()),
      description: await TextEditor.enrichHTML(this.object.system.biodata.description, {async: true}),
      options: this.options,
      owner: this.document.isOwner,
      editScore: this.options.editScore,
      isGM: game.user.isGM
    }
    this.formData = formData;

    console.log("PC : ", formData, this.object);
    return formData;
  }

  
  /* -------------------------------------------- */
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    
    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item")
      let itemId = li.data("item-id")
      const item = this.actor.items.get( itemId )
      item.sheet.render(true)
    })      
    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      console.log(this,li)
      WastelandUtility.confirmDelete(this, li);
    })
    html.find('.edit-item-data').change(ev => {
      const li = $(ev.currentTarget).parents(".item")
      let itemId    = li.data("item-id")
      let itemType  = li.data("item-type")
      let itemField = $(ev.currentTarget).data("item-field")
      let dataType = $(ev.currentTarget).data("dtype")
      let value = ev.currentTarget.value
      this.actor.editItemField(itemId, itemType, itemField, dataType, value)
    })
    
    html.find('.quantity-minus').click(event => {
      const li = $(event.currentTarget).parents(".item");
      this.actor.incDecQuantity( li.data("item-id"), -1 );
    } );
    html.find('.quantity-plus').click(event => {
      const li = $(event.currentTarget).parents(".item");
      this.actor.incDecQuantity( li.data("item-id"), +1 );
    } );

    html.find('.roll-attribut').click((event) => {
      const li = $(event.currentTarget).parents(".item")
      let attrKey = li.data("attr-key")
      this.actor.rollAttribut(attrKey)
    })
    html.find('.roll-competence').click((event) => {
      const li = $(event.currentTarget).parents(".item")
      let attrKey = $(event.currentTarget).data("attr-key")
      let compId  = li.data("item-id")
      this.actor.rollCompetence(attrKey, compId)
    })
    html.find('.roll-rune').click((event) => {
      const li = $(event.currentTarget).parents(".item")
      let runeId  = li.data("item-id")
      this.actor.rollRune(runeId)
    })
    html.find('.roll-arme-offensif').click((event) => {
      const li = $(event.currentTarget).parents(".item")
      let armeId  = li.data("item-id")
      this.actor.rollArmeOffensif(armeId)
    })
    html.find('.roll-arme-degats').click((event) => {
      const li = $(event.currentTarget).parents(".item")
      let armeId  = li.data("item-id")
      this.actor.rollArmeDegats(armeId)
    })
        
    
    html.find('.lock-unlock-sheet').click((event) => {
      this.options.editScore = !this.options.editScore;
      this.render(true);
    });    
    html.find('.item-equip').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.equipItem( li.data("item-id") );
      this.render(true);      
    });

  }
  
  /* -------------------------------------------- */
  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */
  /*async _onDropItem(event, dragData) {
    let item = await WastelandUtility.searchItem( dragData)
    this.actor.preprocessItem( event, item, true )
    super._onDropItem(event, dragData)
  }*/

  /* -------------------------------------------- */
  /** @override */
  _updateObject(event, formData) {
    // Update the Actor
    return this.object.update(formData);
  }
}
