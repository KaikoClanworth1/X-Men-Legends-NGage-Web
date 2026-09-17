# Mission script `e25cMA`

Episode table index(es): [27]

Map: `map=map03_man_1.btm records=6 startInv=0`

Dialogue slots: 0=mission24.dlg

## Class / handler table
```
// mission e25cMA: factory 0x100a2e64, ctor 0x100a2e2c, vtable 0x1011d84c
//   vtable[2] = 0x100a2e54 (dtor)
//   vtable[3] = 0x100a2e8c (Init/RegisterHandlers)
//   vtable[4] = 0x100a2f70 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a2e88
```

## Objectives referenced


## Transitions / progression
- ChangeLevel("e25cMA", 2)
- SetNextMovie("mv_15")

## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/e25cMA.txt)
```js
func fn_100a2e2c  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d84c
    goto L_100a2e4c
  L_100a2e4c:
    return
    this.fc4 = 0x1011d84c
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d84c)

func fn_100a2e64  // 
    operator_new(0xd0, )
    cmp ret_operator_new, 0
    if(ne) sub_100a2e2c(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a2e8c  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(1)
    Script::RegisterHandler("NULL", fn_100a2e88)
    Api::LoadDialogueFile("mission24", 0)
    Script::ReserveSaveVars(2)
    Script::AddSaveVar(&this.fc8)
    Script::AddSaveVar(&this.fcc)
    this.fc8 = 0
    this.fcc = 0
    Script::SetTimerCallback(0, fn_100a323c)
    Script::SetVarBC()
    goto L_100a2f64
  L_100a2f64:
    return

func fn_100a2f70  // VTABLE OnStart
    Script::GetVarC0()
    cmp ret_GetVarC0, 2
    if(eq) sub_100a323c((eq? this : ret_GetVarC0), ?, ?, ?)
    cmp this.fcc, 0
    goto_ne L_100a3004
    this.fcc = 1
    Api::ResetPartyEquipFx()
    Api::SetFacing("xavier", 3)
    Api::SetFacing("jean", 4)
    Api::SetFacing("cyclops", 5)
    Api::SetFacing("nightcrawler", 4)
    Api::FadeIn(this, fn_100a3060)
  L_100a3004:
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::CameraPanTo(0xc65, 0x1ad6, 0x1000)
    goto L_100a3058
  L_100a3058:
    return

func fn_100a3060  // 
    cmp this.fc8, 0xb
    switch(this.fc8) -> jumptable at 0x100a307c
    goto L_100a3230
  L_100a30ac:
    Api::WalkToTile("magma", 0x20, 0x46, 2)
    sub_100a323c(this, ?, ?, ?)
    goto L_100a3230
  L_100a30d8:
    Api::FaceEntity("jean", "magma")
    goto L_100a31d8
  L_100a3124:
    Api::SetNextMovie("mv_15")
    Api::ChangeLevel("e25cMA", 2)
    goto L_100a3230
  L_100a314c:
    Api::SetFacing("xavier", 7)
    goto L_100a31d8
  L_100a3198:
    Script::StartTimer(0, 0x1f4, 0)
    goto L_100a3230
  L_100a31b0:
  L_100a31d8:
    Api::StartDialogue("Xavier-2", this, fn_100a324c, 0)   // dlg mission24: Xavier: … ... results=0
    goto L_100a3230
  L_100a31f0:
    Api::FadeOut(this, fn_100a323c)
    goto L_100a3230
  L_100a321c:
    Api::SetPlayerControl(1)
    Api::Sub20_UIState()
  L_100a3230:
    return
  L_100a323c:
    ret_Sub20_UIState[0xc8] = (ret_Sub20_UIState[0xc8] + 1)
    goto L_100a3060
    goto L_100a323c
```
