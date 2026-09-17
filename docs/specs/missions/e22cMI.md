# Mission script `e22cMI`

Map: `map=map12_muir_in.btm records=6 startInv=1`

Dialogue slots: 0=e22m22.dlg

## Class / handler table
```
// mission e22cMI: factory 0x100a27d0, ctor 0x100a2798, vtable 0x1011d7ec
//   vtable[2] = 0x100a27c0 (dtor)
//   vtable[3] = 0x100a27f8 (Init/RegisterHandlers)
//   vtable[4] = 0x100a2964 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a27f4
//   "moira" -> fn_100a2de0
```

## Objectives referenced


## Transitions / progression
- CompleteEpisode(1)

## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/e22cMI.txt)
```js
func fn_100a2798  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d7ec
    goto L_100a27b8
  L_100a27b8:
    return
    this.fc4 = 0x1011d7ec
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d7ec)

func fn_100a27d0  // 
    operator_new(0xd0, )
    cmp ret_operator_new, 0
    if(ne) sub_100a2798(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a27f8  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(2)
    Script::RegisterHandler("NULL", fn_100a27f4)
    Script::RegisterHandler("moira", fn_100a2de0)
    Api::LoadDialogueFile("e22m22", 0)
    Api::LoadSoundBank("space_doors.swb")
    Api::LoadSoundBank("mach_bank_1.swb")
    Api::LoadSoundBank("errie_bank_1.swb")
    Api::LoadSoundBank("errie_bank_2.swb")
    Api::LoadSoundBank("forcefield_loops.swb")
    Api::LoadSoundBank("g_muir.swb")
    Script::ReserveSaveVars(2)
    Script::AddSaveVar(&this.fc8)
    Script::AddSaveVar(&this.fcc)
    this.fc8 = 0
    this.fcc = 0
    Script::SetTimerCallback(0, fn_100a2af8)
    goto L_100a2958
  L_100a2958:
    return

func fn_100a2964  // VTABLE OnStart
    Api::ResetPartyEquipFx()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::CameraPanTo(0x2bc, 0x1004, 0x1000)
    Api::FadeIn(this, fn_100a2b0c)
    Script::GetPartyMemberId(0)
    Api::FaceEntityIdName(ret_GetPartyMemberId, "moira")
    Script::GetPartyMemberId(1)
    Api::FaceEntityIdName(ret_GetPartyMemberId, "moira")
    Script::GetPartyMemberId(2)
    Api::FaceEntityIdName(ret_GetPartyMemberId, "moira")
    Script::GetPartyMemberId(3)
    Api::FaceEntityIdName(ret_GetPartyMemberId, "moira")
    goto L_100a2a48
  L_100a2a48:
    return

func fn_100a2a50  // 
    cmp (this.fcc - 1), 3
    switch((this.fcc - 1)) -> jumptable at 0x100a2a70
    goto L_100a2ae4
  L_100a2a80:
    goto L_100a2abc
  L_100a2a88:
    Api::PlaySound("menu_back", -1, 0)
    Script::StartTimer(0, 0x7d0, 0)
    goto L_100a2aec
  L_100a2ab8:
  L_100a2abc:
    Api::WalkToTile("moira", 5, 0x28, 7)
    goto L_100a2aec
  L_100a2adc:
    this.fcc = 0
  L_100a2ae4:
    sub_100a2dcc(this, ?, ?, 0)
  L_100a2aec:
    return
  L_100a2af8:
    ret_sub_100a2dcc[0xcc] = (ret_sub_100a2dcc[0xcc] + 1)
    goto L_100a2a50
    goto L_100a2af8

func fn_100a2b0c  // 
    cmp this.fc8, 0xb
    switch(this.fc8) -> jumptable at 0x100a2b28
    goto L_100a2dc0
  L_100a2b58:
    goto L_100a2d60
  L_100a2b90:
    goto L_100a2d60
  L_100a2bc8:
    goto L_100a2d60
  L_100a2c00:
    Api::RemoveEntity("illyanainbed")
    Api::Teleport("illyanacured", 0x28a, 0xf6e, 7)
    goto L_100a2ccc
  L_100a2c3c:
    Api::FadeIn(this, fn_100a2dcc)
    goto L_100a2dc0
  L_100a2c68:
    goto L_100a2d60
  L_100a2ca0:
    Api::SpawnEmitter("smoke0", "smoke", 0x226, 0x1036, 0, 3)
  L_100a2ccc:
    sub_100a2dcc(this, ?, ?, ?)
    goto L_100a2dc0
  L_100a2ce8:
    goto L_100a2d60
  L_100a2d20:
    Api::GiveQuestXP(0x1e8480)
    Api::ShowPopupText(0x52)   // text: 2,000,000 Quest XP
  L_100a2d60:
    Api::StartDialogue("Illyana-6", this, fn_100a2ddc, 0)   // dlg e22m22: Moira: … ... results=0
    goto L_100a2dc0
  L_100a2d7c:
    Api::FadeOut(this, fn_100a2dcc)
    goto L_100a2dc0
  L_100a2da8:
    Api::SetPlayerControl(1)
    Api::CompleteEpisode(1)
  L_100a2dc0:
    return
  L_100a2dcc:
    ret_CompleteEpisode[0xc8] = (ret_CompleteEpisode[0xc8] + 1)
    goto L_100a2b0c
    goto L_100a2dcc

func fn_100a2de0  // HANDLER for "moira"
    Entity::GetName(evt[0x0], )
    strcmp("moira", )
    cmp ret_strcmp, 0
    goto_ne L_100a2e24
    cmp evt[0x8], 5
    goto_ne L_100a2e24
    sub_100a2af8(this, ?, ?, evt[0x8])
    goto L_100a2e24
  L_100a2e24:
    return
```
