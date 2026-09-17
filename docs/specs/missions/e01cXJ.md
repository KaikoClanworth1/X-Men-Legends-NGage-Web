# Mission script `e01cXJ`

Map: `map=map27_xjet.btm records=3 startInv=0`

Dialogue slots: 0=mission01.dlg

## Class / handler table
```
// mission e01cXJ: factory 0x100a1b40, ctor 0x100a1b08, vtable 0x1011d33c
//   vtable[2] = 0x100a1b30 (dtor)
//   vtable[3] = 0x100a1b68 (Init/RegisterHandlers)
//   vtable[4] = 0x100a1c04 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a1b64
```

## Objectives referenced


## Transitions / progression
- CompleteEpisode(1)
- SetNextMovie("mv_02")

## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/e01cXJ.txt)
```js
func fn_100a1b08  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d33c
    goto L_100a1b28
  L_100a1b28:
    return
    this.fc4 = 0x1011d33c
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d33c)

func fn_100a1b40  // 
    operator_new(0xc8, )
    cmp ret_operator_new, 0
    if(ne) sub_100a1b08(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a1b68  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(1)
    Script::RegisterHandler("NULL", fn_100a1b64)
    Api::LoadDialogueFile("mission01", 0)
    Api::LoadSoundBank("errie_bank_2.swb")
    Api::LoadSoundBank("mach_bank_1.swb")
    goto L_100a1bf8
  L_100a1bf8:
    return

func fn_100a1c04  // VTABLE OnStart
    Api::ResetPartyEquipFx()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::CameraPanTo(0x258, 0x258, 0x1000)
    Api::FadeIn(this, fn_100a1c78)
    goto L_100a1c70
  L_100a1c70:
    return

func fn_100a1c78  // 
    Api::StartDialogue("InXJet", this, fn_100a1ccc, 0)   // dlg mission01: Alison: … ... results=0
    goto L_100a1cc0
  L_100a1cc0:
    return
    tailcall Api::FadeOut(r0=ret_StartDialogue[0x0], ret_StartDialogue, -0x10000, fn_100a1cf4)

func fn_100a1cf4  // 
    Api::SetPlayerControl(1)
    Api::SetNextMovie("mv_02")
    Api::CompleteEpisode(1)
    goto L_100a1d28
  L_100a1d28:
    return
```
