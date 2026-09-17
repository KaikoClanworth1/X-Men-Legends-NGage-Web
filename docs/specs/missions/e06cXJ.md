# Mission script `e06cXJ`

Map: `map=map27_xjet.btm records=2 startInv=0`

Dialogue slots: 0=mission06.dlg

## Class / handler table
```
// mission e06cXJ: factory 0x100a1d68, ctor 0x100a1d30, vtable 0x1011d4a4
//   vtable[2] = 0x100a1d58 (dtor)
//   vtable[3] = 0x100a1d90 (Init/RegisterHandlers)
//   vtable[4] = 0x100a1e1c (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a1d8c
```

## Objectives referenced


## Transitions / progression
- CompleteEpisode(1)
- SetNextMovie("mv_04")

## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/e06cXJ.txt)
```js
func fn_100a1d30  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d4a4
    goto L_100a1d50
  L_100a1d50:
    return
    this.fc4 = 0x1011d4a4
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d4a4)

func fn_100a1d68  // 
    operator_new(0xc8, )
    cmp ret_operator_new, 0
    if(ne) sub_100a1d30(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a1d90  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(1)
    Script::RegisterHandler("NULL", fn_100a1d8c)
    Api::LoadDialogueFile("mission06", 0)
    Api::LoadSoundBank("errie_bank_2.swb")
    goto L_100a1e10
  L_100a1e10:
    return

func fn_100a1e1c  // VTABLE OnStart
    Api::ResetPartyEquipFx()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::CameraPanTo(0x258, 0x258, 0x1000)
    Api::FadeIn(this, fn_100a1e90)
    goto L_100a1e88
  L_100a1e88:
    return

func fn_100a1e90  // 
    Api::StartDialogue("InXJet", this, fn_100a1ee4, 0)   // dlg mission06: Xavier: … ... results=0
    goto L_100a1ed8
  L_100a1ed8:
    return
    tailcall Api::FadeOut(r0=ret_StartDialogue[0x0], ret_StartDialogue, -0x10000, fn_100a1f0c)

func fn_100a1f0c  // 
    Api::SetPlayerControl(1)
    Api::SetNextMovie("mv_04")
    Api::CompleteEpisode(1)
    goto L_100a1f40
  L_100a1f40:
    return
```
