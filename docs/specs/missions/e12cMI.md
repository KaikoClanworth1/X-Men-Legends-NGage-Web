# Mission script `e12cMI`

Map: `map=map12_muir_in.btm records=4 startInv=0`

Dialogue slots: 0=mission12.dlg

## Class / handler table
```
// mission e12cMI: factory 0x100a1f80, ctor 0x100a1f48, vtable 0x1011d60c
//   vtable[2] = 0x100a1f70 (dtor)
//   vtable[3] = 0x100a1fa8 (Init/RegisterHandlers)
//   vtable[4] = 0x100a20e0 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a1fa4
//   "moira" -> fn_100a2244
```

## Objectives referenced


## Transitions / progression
- CompleteEpisode(1)

## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/e12cMI.txt)
```js
func fn_100a1f48  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d60c
    goto L_100a1f68
  L_100a1f68:
    return
    this.fc4 = 0x1011d60c
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d60c)

func fn_100a1f80  // 
    operator_new(0xcc, )
    cmp ret_operator_new, 0
    if(ne) sub_100a1f48(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a1fa8  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(2)
    Script::RegisterHandler("NULL", fn_100a1fa4)
    Script::RegisterHandler("moira", fn_100a2244)
    Api::LoadDialogueFile("mission12", 0)
    Api::LoadSoundBank("space_doors.swb")
    Api::LoadSoundBank("mach_bank_1.swb")
    Api::LoadSoundBank("errie_bank_1.swb")
    Api::LoadSoundBank("errie_bank_2.swb")
    Api::LoadSoundBank("forcefield_loops.swb")
    Api::LoadSoundBank("g_muir.swb")
    Script::ReserveSaveVars(1)
    Script::AddSaveVar(&this.fc8)
    this.fc8 = 0
    goto L_100a20d4
  L_100a20d4:
    return

func fn_100a20e0  // VTABLE OnStart
    Api::ResetPartyEquipFx()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::CameraPanTo(0x2bc, 0x1004, 0x1000)
    Api::FadeIn(this, fn_100a2158)
    goto L_100a2150
  L_100a2150:
    return

func fn_100a2158  // 
    Script::GetPartyMemberId(0)
    Api::SetDialogueSpeakerName(ret_GetPartyMemberId)
    Api::StartDialogue("Illyana-1", this, fn_100a21c4, 0)   // dlg mission12: (Player): … ... results=0
    goto L_100a21b8
  L_100a21b8:
    return

func fn_100a21c4  // 
    cmp this.fc8, 0
    goto_ne L_100a2200
    Api::WalkToTile("moira", 5, 0x28, 4)
    goto L_100a2238
  L_100a2200:
    cmp ?[0xc8], 2
    goto_ne L_100a2238
    Api::FadeOut([?[0x0]] ?, fn_100a2344)
    goto L_100a2238
  L_100a2238:
    return

func fn_100a2244  // HANDLER for "moira"
    Entity::GetName(evt[0x0], )
    strcmp("moira", )
    cmp ret_strcmp, 0
    goto_ne L_100a2338
    cmp evt[0x8], 5
    goto_ne L_100a2338
    cmp this.fc8, 0
    goto_ne L_100a22cc
    this.fc8 = 1
    Api::PlaySound("menu_back", -1, this.fc8)
    Api::WalkToTile("moira", evt[0x8], 0x28, 7)
    goto L_100a2338
  L_100a22cc:
    cmp this.fc8, 1
    goto_ne L_100a2338
    this.fc8 = 2
    Script::GetPartyMemberId(0)
    Api::SetDialogueSpeakerName(ret_GetPartyMemberId)
    Api::StartDialogue("Illyana-2", this, fn_100a21c4, 0)   // dlg mission12: Moira: … ... results=0
    goto L_100a2338
  L_100a2338:
    return

func fn_100a2344  // 
    Api::SetPlayerControl(1)
    Api::CompleteEpisode(1)
    return
```
