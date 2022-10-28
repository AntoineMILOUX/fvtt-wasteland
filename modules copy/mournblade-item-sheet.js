import { WastelandUtility } from "./wasteland-utility.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class WastelandItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ["fvtt-wasteland", "sheet", "item"],
      template: "systems/fvtt-wasteland/templates/item-sheet.html",
      dragDrop: [{ dragSelector: null, dropSelector: null }],
      width: 620,
      height: 550
      //tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description"}]
    });
  }

  /* -------------------------------------------- */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    // Add "Post to chat" button
    // We previously restricted this to GM and editable items only. If you ever find this comment because it broke something: eh, sorry!
    buttons.unshift(
      {
        class: "post",
        icon: "fas fa-comment",
        onclick: ev => { }
      })
    return buttons
  }

  /* -------------------------------------------- */
  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    if (this.item.type.includes('weapon')) {
      position.width = 640;
    }
    return position;
  }

  /* -------------------------------------------- */
  async getData() {
    const objectData = duplicate(this.object)
    let itemData = objectData 
    let formData = {
      title: this.title,
      id: this.id,
      type: objectData.type,
      img: objectData.img,
      name: objectData.name,
      editable: this.isEditable,
      cssClass: this.isEditable ? "editable" : "locked",
      attributs: WastelandUtility.getAttributs(),
      data: itemData.system,
      limited: this.object.limited,
      options: this.options,
      owner: this.document.isOwner,
      description: await TextEditor.enrichHTML(this.object.system.description, {async: true}),
      mr: (this.object.type == 'specialisation'),
      isGM: game.user.isGM
    }

    if (  objectData.type == "don") {
      formData.sacrifice = await TextEditor.enrichHTML(this.object.system.sacrifice, {async: true})
    }
    //this.options.editable = !(this.object.origin == "embeddedItem");
    console.log("ITEM DATA", formData, this);
    return formData;
  }


  /* -------------------------------------------- */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    buttons.unshift({
      class: "post",
      icon: "fas fa-comment",
      onclick: ev => this.postItem()
    });
    return buttons
  }

  /* -------------------------------------------- */
  postItem() {
    let chatData = duplicate(WastelandUtility.data(this.item));
    if (this.actor) {
      chatData.actor = { id: this.actor.id };
    }
    // Don't post any image for the item (which would leave a large gap) if the default image is used
    if (chatData.img.includes("/blank.png")) {
      chatData.img = null;
    }
    // JSON object for easy creation
    chatData.jsondata = JSON.stringify(
      {
        compendium: "postedItem",
        payload: chatData,
      });

    renderTemplate('systems/fvtt-Wasteland-rpg/templates/post-item.html', chatData).then(html => {
      let chatOptions = WastelandUtility.chatDataSetup(html);
      ChatMessage.create(chatOptions)
    });
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
      const item = this.object.options.actor.getOwnedItem(li.data("item-id"))
      item.sheet.render(true);
    });

    html.find('.delete-subitem').click(ev => {
      this.deleteSubitem(ev);
    })
    html.find('.edit-prediction').change(ev => {
      const li = $(ev.currentTarget).parents(".prediction-item")
      let index = li.data("prediction-index")
      let pred = duplicate(this.object.system.predilections)
      pred[index].name = ev.currentTarget.value
      this.object.update( { 'data.predilections': pred })
    })
    html.find('.delete-prediction').click(ev => {
      const li = $(ev.currentTarget).parents(".prediction-item")
      let index = li.data("prediction-index")
      let pred = duplicate(this.object.system.predilections)
      pred.splice(index,1)
      this.object.update( { 'data.predilections': pred })
    })
    html.find('.use-prediction').change(ev => {
      const li = $(ev.currentTarget).parents(".prediction-item")
      let index = li.data("prediction-index")
      let pred = duplicate(this.object.system.predilections)
      pred[index].used = ev.currentTarget.checked
      this.object.update( { 'data.predilections': pred })
    })    
    html.find('#add-predilection').click(ev => {
      let pred = duplicate(this.object.system.predilections)
      pred.push( { name: "Nouvelle prédilection", used: false }) 
      this.object.update( { 'data.predilections': pred })
    })
    // Update Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("item-id");
      let itemType = li.data("item-type");
    });

  }

  /* -------------------------------------------- */
  get template() {
    let type = this.item.type;
    return `systems/fvtt-wasteland/templates/item-${type}-sheet.html`;
  }

  /* -------------------------------------------- */
  /** @override */
  _updateObject(event, formData) {
    return this.object.update(formData);
  }
}
