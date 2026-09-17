# Mission script `e16cMI`

Map: `map=map12_muir_in.btm records=4 startInv=0`

Dialogue slots: 0=e16m21.dlg

## Class / handler table
```
// mission e16cMI: factory 0x100a23a4, ctor 0x100a236c, vtable 0x1011d6fc
//   vtable[2] = 0x100a2394 (dtor)
//   vtable[3] = 0x100a23cc (Init/RegisterHandlers)
//   vtable[4] = 0x100a2524 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a23c8
//   "moira" -> fn_100a274c
```

## Objectives referenced


## Transitions / progression
- CompleteEpisode(1)
- SetNextMovie("mv_09")

## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/e16cMI.txt)
```js
func fn_100a236c  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d6fc
    goto L_100a238c
  L_100a238c:
    return
    this.fc4 = 0x1011d6fc
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d6fc)

func fn_100a23a4  // 
    operator_new(0xcc, )
    cmp ret_operator_new, 0
    if(ne) sub_100a236c(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a23cc  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(2)
    Script::RegisterHandler("NULL", fn_100a23c8)
    Script::RegisterHandler("moira", fn_100a274c)
    Api::LoadDialogueFile("e16m21", 0)
    Api::LoadSoundBank("space_doors.swb")
    Api::LoadSoundBank("mach_bank_1.swb")
    Api::LoadSoundBank("errie_bank_1.swb")
    Api::LoadSoundBank("errie_bank_2.swb")
    Api::LoadSoundBank("forcefield_loops.swb")
    Api::LoadSoundBank("g_muir.swb")
    Script::ReserveSaveVars(1)
    Script::AddSaveVar(&this.fc8)
    this.fc8 = 0
    Script::SetTimerCallback(0, fn_100a2738)
    goto L_100a2518
  L_100a2518:
    return

func fn_100a2524  // VTABLE OnStart
    Api::ResetPartyEquipFx()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::CameraPanTo(0x2bc, 0x1004, 0x1000)
    Api::FadeIn(this, fn_100a259c)
    goto L_100a2594
  L_100a2594:
    return

func fn_100a259c  // 
    cmp this.fc8, 6
    switch(this.fc8) -> jumptable at 0x100a25b8
    goto L_100a272c
  L_100a25d4:
    goto L_100a26bc
  L_100a260c:
    goto L_100a2674
  L_100a2614:
    Api::PlaySound("menu_back", -1, 0)
    Api::PlaySound("menu_back", -1, 0)
    Api::PlaySound("menu_back", -1, 0)
    Script::StartTimer(0, 0x5dc, 0)
    goto L_100a272c
  L_100a2670:
  L_100a2674:
    Api::WalkToTile("moira", 5, 0x28, 7)
    goto L_100a272c
  L_100a2694:
  L_100a26bc:
    Api::StartDialogue("Illyana-2", this, fn_100a2748, 0)   // dlg e16m21: Moira: This fungus seems to eliminate all signs of mutation from the cells it touches, with all of the signs o ... results=0
    goto L_100a272c
  L_100a26d4:
    Api::FadeOut(this, fn_100a2738)
    goto L_100a272c
  L_100a2700:
    Api::SetPlayerControl(1)
    Api::SetNextMovie("mv_09")
    Api::CompleteEpisode(1)
    goto L_100a272c
  L_100a272c:
    return
  L_100a2738:
    ret_CompleteEpisode[0xc8] = (ret_CompleteEpisode[0xc8] + 1)
    goto L_100a259c
    goto L_100a2738

func fn_100a274c  // HANDLER for "moira"
    Entity::GetName(evt[0x0], )
    strcmp("moira", )
    cmp ret_strcmp, 0
    goto_ne L_100a2790
    cmp evt[0x8], 5
    goto_ne L_100a2790
    sub_100a2738(this, ?, ?, evt[0x8])
    goto L_100a2790
  L_100a2790:
    return
```
