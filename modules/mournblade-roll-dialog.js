import { MournbladeUtility } from "./mournblade-utility.js";

export class MournbladeRollDialog extends Dialog {

  /* -------------------------------------------- */
  static async create(actor, rollData ) {

    let options = { classes: ["MournbladeDialog"], width: 340, height: 420, 'z-index': 99999 };
    let html = await renderTemplate('systems/fvtt-mournblade/templates/roll-dialog-generic.html', rollData);

    return new MournbladeRollDialog(actor, rollData, html, options );
  }

  /* -------------------------------------------- */
  constructor(actor, rollData, html, options, close = undefined) {
    let conf = {
      title: "Test de Capacité",
      content: html,
      buttons: { 
        rolld10: {
            icon: '<i class="fas fa-check"></i>',
            label: "Lancer 1d10",
            callback: () => { this.roll("1d10") } 
          },
          rolld20: {
            icon: '<i class="fas fa-check"></i>',
            label: "Lancer 1d20",
            callback: () => { this.roll("1d20") } 
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Annuler",
            callback: () => { this.close() }
        } },
      close: close
    }

    super(conf, options);

    this.actor = actor
    this.rollData = rollData
  }

  /* -------------------------------------------- */
  roll ( dice) {
    this.rollData.mainDice = dice
    MournbladeUtility.rollMournblade( this.rollData )
  }


  /* -------------------------------------------- */
  activateListeners(html) {
    super.activateListeners(html);

    var dialog = this;
    function onLoad() {
    }
    $(function () { onLoad(); });
    
    html.find('#modificateur').change(async (event) =>  {
      this.rollData.modificateur = Number(event.currentTarget.value)
    })
    html.find('#difficulte').change(async (event) =>  {
      this.rollData.difficulte = Number(event.currentTarget.value)
    })
    html.find('#attrKey').change(async (event) =>  {
      this.rollData.attrKey = String(event.currentTarget.value)
    })    
    html.find('#runemode').change(async (event) =>  {
      this.rollData.runemode = String(event.currentTarget.value)
    })    
    html.find('#runeame').change(async (event) =>  {
      this.rollData.runeame = Number(event.currentTarget.value)
    })    
    html.find('#doubleD20').change(async (event) =>  {
      this.rollData.doubleD20 = event.currentTarget.checked
    })         
  }
}