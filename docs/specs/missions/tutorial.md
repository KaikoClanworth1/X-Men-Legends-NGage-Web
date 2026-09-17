# Mission script `tutorial`

Episode table index(es): [0]

Map: `map=map00_tutorial.btm records=38 startInv=1`

Dialogue slots: 0=tutorial.dlg

## Class / handler table
```
// mission tutorial: factory 0x100a3288, ctor 0x100a3250, vtable 0x1011c710
//   vtable[2] = 0x100a3278 (dtor)
//   vtable[3] = 0x100a32b0 (Init/RegisterHandlers)
//   vtable[4] = 0x100a3cf8 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a32ac
//   "brawler1" -> fn_100a4620
//   "brawler2" -> fn_100a4620
//   "court1" -> fn_100a4684
//   "court2" -> fn_100a46a8
//   "switchdoor1" -> fn_100a4c24
//   "switchdoor2" -> fn_100a4c24
//   "switchbackdoor1" -> fn_100a4c8c
//   "switchbackdoor2" -> fn_100a4c8c
//   "switchbackdoor3" -> fn_100a4c8c
//   "switchbackdoor4" -> fn_100a4c8c
//   "exit2" -> fn_100a3fac
//   "tut1d" -> fn_100a40b4
//   "tut2a" -> fn_100a46d8
//   "tut3a" -> fn_100a4cf4
//   "tut4c" -> fn_100a5344
//   "tut5c" -> fn_100a581c
//   "map" -> fn_100a515c
//   "forcefield1a" -> fn_100a5228
//   "forcefield1b" -> fn_100a5228
//   "forcefield1c" -> fn_100a5228
//   "forcefield1d" -> fn_100a5228
//   "barrierroom1a" -> fn_100a52fc
//   "barrierroom1b" -> fn_100a52fc
//   "barrierroom1c" -> fn_100a52fc
//   "barrierroom1d" -> fn_100a52fc
//   "barrierroom1e" -> fn_100a52fc
//   "barrierroom1f" -> fn_100a52fc
//   "barriersendroom1" -> fn_100a5320
//   "barriersendroom2" -> fn_100a5320
//   "barriersendroom3" -> fn_100a5320
//   "barriersendroom4" -> fn_100a5320
//   "barriersendroom5" -> fn_100a5320
//   "barriersendroom6" -> fn_100a5320
//   "brawler3" -> fn_100a5d54
//   "brawler4" -> fn_100a5d54
//   "specialroom1" -> fn_100a5e14
//   "specialroom2" -> fn_100a5e14
//   "player0" -> fn_100a5e54
```

## Objectives referenced
- 48: Select a training program
- 50: Proceed to the next room
- 51: Kill first training dummy
- 52: Kill second training dummy
- 53: Destroy breakable wall
- 54: Disable forcefield
- 55: Pick up item
- 56: Use item
- 57: Use Wolverine's special to kill the drone
- 58: Use Cyclop's special to kill the dummy
- 59: Switch to Cyclops and proceed to the next room
- 60: Switch to Wolverine and proceed to the final room

## Transitions / progression


## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/tutorial.txt)
```js
func fn_100a3250  // 
    Script::ctor(evt)
    this.fc4 = 0x1011c710
    goto L_100a3270
  L_100a3270:
    return
    this.fc4 = 0x1011c710
    tailcall Script::dtor(r0=this, ?, ?, 0x1011c710)

func fn_100a3288  // 
    operator_new(0x128, )
    cmp ret_operator_new, 0
    if(ne) sub_100a3250(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a32b0  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(0x27)
    Script::RegisterHandler("NULL", fn_100a32ac)
    Script::RegisterHandler("brawler1", fn_100a4620)
    Script::RegisterHandler("brawler2", fn_100a4620)
    Script::RegisterHandler("court1", fn_100a4684)
    Script::RegisterHandler("court2", fn_100a46a8)
    Script::RegisterHandler("switchdoor1", fn_100a4c24)
    Script::RegisterHandler("switchdoor2", fn_100a4c24)
    Script::RegisterHandler("switchbackdoor1", fn_100a4c8c)
    Script::RegisterHandler("switchbackdoor2", fn_100a4c8c)
    Script::RegisterHandler("switchbackdoor3", fn_100a4c8c)
    Script::RegisterHandler("switchbackdoor4", fn_100a4c8c)
    Script::RegisterHandler("exit2", fn_100a3fac)
    Script::RegisterHandler("tut1d", fn_100a40b4)
    Script::RegisterHandler("tut2a", fn_100a46d8)
    Script::RegisterHandler("tut3a", fn_100a4cf4)
    Script::RegisterHandler("tut4c", fn_100a5344)
    Script::RegisterHandler("tut5c", fn_100a581c)
    Script::RegisterHandler("map", fn_100a515c)
    Script::RegisterHandler("forcefield1a", fn_100a5228)
    Script::RegisterHandler("forcefield1b", fn_100a5228)
    goto L_100a36c0
  L_100a36c0:
    Script::RegisterHandler("forcefield1c", fn_100a5228)
    Script::RegisterHandler("forcefield1d", fn_100a5228)
    Script::RegisterHandler("barrierroom1a", fn_100a52fc)
    Script::RegisterHandler("barrierroom1b", fn_100a52fc)
    Script::RegisterHandler("barrierroom1c", fn_100a52fc)
    Script::RegisterHandler("barrierroom1d", fn_100a52fc)
    Script::RegisterHandler("barrierroom1e", fn_100a52fc)
    Script::RegisterHandler("barrierroom1f", fn_100a52fc)
    Script::RegisterHandler("barriersendroom1", fn_100a5320)
    Script::RegisterHandler("barriersendroom2", fn_100a5320)
    Script::RegisterHandler("barriersendroom3", fn_100a5320)
    Script::RegisterHandler("barriersendroom4", fn_100a5320)
    Script::RegisterHandler("barriersendroom5", fn_100a5320)
    Script::RegisterHandler("barriersendroom6", fn_100a5320)
    Script::RegisterHandler("brawler3", fn_100a5d54)
    Script::RegisterHandler("brawler4", fn_100a5d54)
    Script::RegisterHandler("specialroom1", fn_100a5e14)
    Script::RegisterHandler("specialroom2", fn_100a5e14)
    Script::RegisterHandler("player0", fn_100a5e54)
    Script::ReserveSaveVars(0x13)
    Script::AddSaveVar(&this.fcc)
    Script::AddSaveVar(&this.fd0)
    Script::AddSaveVar(&this.fd4)
    Script::AddSaveVar(&this.fd8)
    goto L_100a3a84
  L_100a3a84:
    Script::AddSaveVar(&this.fc8)
    Script::AddSaveVar(&this.fdc)
    Script::AddSaveVar(&this.fe0)
    Script::AddSaveVar(&this.fe4)
    Script::AddSaveVar(&this.fe8)
    Script::AddSaveVar(&this.fec)
    Script::AddSaveVar(&this.ff0)
    Script::AddSaveVar(&this.ff4)
    Script::AddSaveVar(&this.ff8)
    Script::AddSaveVar(&this.ffc)
    Script::AddSaveVar(&this.f100)
    Script::AddSaveVar(&this.f104)
    Script::AddSaveVar(&this.f108)
    Script::AddSaveVar(&this.f10c)
    Script::AddSaveVar(&this.f110)
    this.fcc = 0
    this.fd0 = 0
    this.fc8 = 0
    this.fdc = 0
    this.fe0 = 0
    this.fe4 = 0
    this.ffc = 0
    this.fd4 = 0
    this.fd8 = 0
    this.fe8 = 0
    this.fec = 0
    this.ff0 = 0
    this.ff8 = 0
    this.ff4 = 0
    this.f100 = 0
    this.f104 = 0
    this.f108 = 0
    this.f10c = 0
    this.f110 = 0
    this.f114 = 0
    this.f118 = 0
    this.f11c = 0
    this.f120 = 0
    this.f124 = 0
    Script::SetTimerCallback(0, fn_100a460c)
    Script::SetTimerCallback(1, fn_100a578c)
    Script::SetTimerCallback(2, fn_100a5d40)
    Script::SetTimerCallback(3, fn_100a57d4)
    Api::LoadDialogueFile("tutorial", 0)
    Api::LoadSoundBank("exploding_walls.swb")
    Api::SetCharTypeLevel("bhbrawler", 1, 1)
    Api::SetHealth("brawler3", 0x10)
    Api::SetHealth("brawler4", 0x10)
    Api::SetCharTypeLevel("cyclops", 3, 1)
    Script::SetVarBC()
    goto L_100a3cec
  L_100a3cec:
    return

func fn_100a3cf8  // VTABLE OnStart
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 1)
    Api::SetCinematicMode(0, 0)
    Api::SetHudVisible(0)
    Script::GetPartyMemberId(0)
    Api::SetUnkillableId(ret_GetPartyMemberId, 1)
    this.fc8 = 1
    sub_100a3d68(this, ?, ?, 1)
    return

func fn_100a3d68  // 
    cmp this.fcc, 0
    goto_eq L_100a3d8c
    cmp this.fcc, 1
    goto_eq L_100a3dd0
    goto L_100a3e38
  L_100a3d8c:
    Api::SetPlayerControl(0)
    Api::CameraFollowPlayer(0x1000)
    Api::FadeIn(this, fn_100a3e44)
    goto L_100a3e38
  L_100a3dd0:
    Api::SetPlayerControl(1)
    cmp this.fc8, 0
    goto_eq L_100a3e04
    goto L_100a3e18
  L_100a3e04:
  L_100a3e18:
    Api::StartDialogue("introreturn", this, 0, 0)   // dlg tutorial: X-Computer: Use the controller key to move in front of a terminal and the confirm key to select a training pro ... results=0
    Api::AddObjective(0x30, 0)   // obj: Select a training program
    goto L_100a3e38
  L_100a3e38:
    return
  L_100a3e44:
    ret_AddObjective[0xcc] = (ret_AddObjective[0xcc] + 1)
    goto L_100a3d68
    goto L_100a3e44

func fn_100a3e58  // 
    cmp evt, 4
    switch(evt) -> jumptable at 0x100a3e70
    goto L_100a3f88
  L_100a3e84:
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x2a8, 0x244, 2)
    this.f114 = 1
    goto L_100a3f88
  L_100a3eb8:
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x3d4, 0x244, 2)
    this.f118 = 1
    goto L_100a3f88
  L_100a3eec:
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x500, 0x244, 2)
    this.f11c = 1
    goto L_100a3f88
  L_100a3f20:
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x62c, 0x244, 2)
    this.f120 = 1
    goto L_100a3f88
  L_100a3f58:
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x758, 0x244, 2)
    this.f124 = 1
  L_100a3f88:
    this.fcc = 0
    sub_100a3d68(this, ?, ?, 0)
    goto L_100a3fa0
  L_100a3fa0:
    return
    cmp ?[0x8], 0
    return
    goto L_100a3fbc

func fn_100a3fbc  // 
    cmp this.ffc, 1
    goto_eq L_100a4038
    goto_gt L_100a3fe4
    cmp this.ffc, 0
    goto_eq L_100a3ff0
    goto L_100a4080
  L_100a3fe4:
    cmp this.ffc, 2
    goto_eq L_100a4064
    goto L_100a4080
  L_100a3ff0:
    Api::ClearMessages()
    Api::StartDialogue("exittutorial", this, fn_100a409c, 0)   // dlg tutorial: X-Computer: This terminal will terminate the X-men training program.  Do you wish to exit? ... results=0,1
    goto L_100a4080
  L_100a4038:
    Api::FadeOut(this, fn_100a408c)
    goto L_100a4080
  L_100a4064:
    Api::SetObjective(0x30, 0, 1)   // obj: Select a training program
    Api::Post0_Sub15_A()
  L_100a4080:
    return
  L_100a408c:
    ret_Post0_Sub15_A[0xfc] = (ret_Post0_Sub15_A[0xfc] + 1)
    goto L_100a3fbc
    cmp ?, 0
    goto_eq L_100a40a8
    goto L_100a408c
  L_100a40a8:
    ret_Post0_Sub15_A[0xfc] = 0
    return

func fn_100a40b4  // HANDLER for "tut1d"
    cmp evt[0x8], 0
    goto_ne L_100a4120
    cmp this.f114, 0
    goto_ne L_100a4118
    Api::StartDialogue("battle", this, fn_100a412c, this.f114)
    goto L_100a4120
  L_100a4118:
    ?[0x114] = 0
  L_100a4120:
    return

func fn_100a412c  // 
    cmp evt, 0
    goto_eq L_100a4154
    sub_100a415c(this, evt, arg2, ?r3)
    Api::SetObjective(0x30, 0, 1)   // obj: Select a training program
  L_100a4154:
    return

func fn_100a415c  // 
    cmp this.fd0, 0xc
    switch(this.fd0) -> jumptable at 0x100a4178
    goto L_100a4600
  L_100a41ac:
    this.fc8 = 0
    Api::MapSet1(7, 0x21, 1)
    goto L_100a4550
  L_100a41cc:
    Api::CameraFollowPlayer(0x1000)
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x28a, 0x1162, 2)
    Api::FadeIn(this, fn_100a460c)
    goto L_100a4600
  L_100a4234:
    Api::StartDialogue("battle1", this, 0, 0)   // dlg tutorial: X-Computer: In this simulation we will be going over some basic movement and combat techniques. ... results=0
    goto L_100a438c
  L_100a4260:
    Api::SetObjective(0x32, 2, 1)   // obj: Proceed to the next room
    goto L_100a4538
  L_100a42ac:
    Api::FindEntityId("brawler2")
    Api::GetEntity(ret_FindEntityId)
    Entity::GetPos(ret_GetEntity, &sp_10, &sp_c, &sp_8)
    Api::CameraPanTo(sp_10, sp_c, 0x2ff)
    goto L_100a4538
  L_100a4328:
    Api::SetCinematicMode(1, 0)
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 0)
    Api::CameraFollowPlayer(0x2ff)
    goto L_100a4600
  L_100a4368:
    Api::StartDialogue("battle4", this, 0, 0)   // dlg tutorial: X-Computer: Alright, you should be in range now. ... results=0
  L_100a438c:
    Api::AddObjective(0x33, 1)   // obj: Kill first training dummy
    goto L_100a4600
  L_100a439c:
    Api::StartDialogue("battle5", this, 0, 0)   // dlg tutorial: X-Computer: Good job! ... results=0
    Api::SetCinematicMode(1, 1)
    Api::SetHudVisible(0)
    Api::MapSet1(7, 0x21, 0)
    Api::SetObjective(0x33, 2, 1)   // obj: Kill first training dummy
    Api::AddObjective(0x34, 1)   // obj: Kill second training dummy
    goto L_100a4600
  L_100a4418:
    Api::FindEntityId("brawler1")
    Api::GetEntity(ret_FindEntityId)
    Entity::GetPos(ret_GetEntity, &sp_10, &sp_c, &sp_8)
    Api::CameraPanTo(sp_10, sp_c, 0x2ff)
    goto L_100a4538
  L_100a4494:
    Api::CameraFollowPlayer(0x2ff)
    Api::SetHudVisible(1)
    Api::MakePartyTarget("brawler1")
    goto L_100a4600
  L_100a44c4:
    Api::SetObjective(0x34, 2, 1)   // obj: Kill second training dummy
    Api::SetHudVisible(0)
    Api::SetCinematicMode(0, 0)
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 1)
  L_100a4538:
    Api::StartDialogue("battleconcluded", this, fn_100a461c, 0)   // dlg tutorial: X-Computer: This concludes the basic movement and combat techniques simulation. ... results=0
    goto L_100a4600
  L_100a4550:
    Api::FadeOut(this, fn_100a460c)
    goto L_100a4600
  L_100a457c:
    this.fd4 = 0
    this.fd8 = 0
    this.fd0 = 0
    Api::SetHealth("brawler1", 0x1e)
    Api::SetHealth("brawler2", 0x1e)
    Api::SetObjective(0x32, 0, 1)   // obj: Proceed to the next room
    Api::SetObjective(0x33, 0, 1)   // obj: Kill first training dummy
    Api::SetObjective(0x34, 0, 1)   // obj: Kill second training dummy
    sub_100a3e58(this, 0, ?, ?)
    goto L_100a4600
  L_100a4600:
    return
  L_100a460c:
    ret_sub_100a3e58[0xd0] = (ret_sub_100a3e58[0xd0] + 1)
    goto L_100a415c
    goto L_100a460c

func fn_100a4620  // HANDLER for "brawler1","brawler2"
    cmp evt[0x8], 4
    goto_ne L_100a4660
    cmp this.fd0, 6
    if(eq) Api::SetHudVisible([(eq? api : this)] (eq? 1 : evt))
    Script::StartTimer(0, 0x2bc, 0)
    goto L_100a467c
  L_100a4660:
    cmp ?[0x8], 0
    goto_ne L_100a467c
    cmp this.fd0, 5
    if(eq) sub_100a460c((eq? this : ret_StartTimer), ?, ?, this.fd0)
  L_100a467c:
    return
    cmp ret_sub_100a460c[0xd4], 0
    return
    cmp ?[0x8], 0
    return
    ret_sub_100a460c[0xd4] = 1
    goto L_100a460c
    cmp ret_sub_100a460c[0xd8], 0
    return
    cmp ret_sub_100a460c[0xd0], 7
    return
    cmp ?[0x8], 0
    return
    ret_sub_100a460c[0xd8] = 1
    goto L_100a460c

func fn_100a46d8  // HANDLER for "tut2a"
    cmp evt[0x8], 0
    goto_ne L_100a4744
    cmp this.f118, 0
    goto_ne L_100a473c
    Api::StartDialogue("switchingcharacters", this, fn_100a4750, this.f118)
    goto L_100a4744
  L_100a473c:
    ?[0x118] = 0
  L_100a4744:
    return

func fn_100a4750  // 
    cmp evt, 0
    goto_eq L_100a47a0
    Api::FadeOut(this, fn_100a47a8)
    Api::SetObjective(0x30, 0, 1)   // obj: Select a training program
    goto L_100a47a0
  L_100a47a0:
    return

func fn_100a47a8  // 
    cmp this.fdc, 6
    goto_eq L_100a4a14
    goto_gt L_100a47f4
    cmp this.fdc, 2
    goto_eq L_100a4908
    goto_gt L_100a47e4
    cmp this.fdc, 0
    goto_eq L_100a4838
    cmp this.fdc, 1
    goto_eq L_100a48d0
    goto L_100a4c04
  L_100a47e4:
    cmp this.fdc, 4
    goto_eq L_100a49c0
    goto_gt L_100a4b68
    goto L_100a4978
  L_100a47f4:
    cmp this.fdc, 0x65
    goto_eq L_100a4abc
    goto_gt L_100a4814
    cmp this.fdc, 0x63
    goto_eq L_100a4a84
    cmp this.fdc, 0x64
    goto_eq L_100a4b68
    goto L_100a4c04
  L_100a4814:
    cmp this.fdc, 0xc8
    goto_eq L_100a4b68
    goto_gt L_100a482c
    cmp this.fdc, 0xc7
    goto_eq L_100a4b28
    goto L_100a4c04
  L_100a482c:
    cmp this.fdc, 0xc9
    goto_eq L_100a4b94
    goto L_100a4c04
  L_100a4838:
    this.fc8 = 0
    Api::CameraFollowPlayer(0x1000)
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x9f6, 0x1162, 2)
    Api::Teleport("cyclops", 0x92e, 0x109a, 6)
    Api::FadeIn(this, fn_100a4c10)
    goto L_100a4c04
  L_100a48d0:
    goto L_100a4b50
  L_100a4908:
    Api::AddObjective(0x3b, 1)   // obj: Switch to Cyclops and proceed to the next room
    Api::SetPlayerControl(1)
    Api::SetHudVisible(1)
    Api::WalkToTile("cyclops", 0x18, 0x2c, -1)
    Api::AddToParty("cyclops")
    goto L_100a4b50
  L_100a4978:
    Api::StartDialogue("switch3", this, 0, 0)   // dlg tutorial: X-Computer: Good job! ... results=0
    Api::SetObjective(0x3b, 2, 1)   // obj: Switch to Cyclops and proceed to the next room
    Api::AddObjective(0x3c, 1)   // obj: Switch to Wolverine and proceed to the final room
    goto L_100a4c04
  L_100a49c0:
    Api::StartDialogue("switch4", this, fn_100a4c20, 0)   // dlg tutorial: X-Computer: Excellent work X-men! ... results=0
    Api::SetObjective(0x3c, 2, 1)   // obj: Switch to Wolverine and proceed to the final room
    goto L_100a4c04
  L_100a4a14:
    Api::SetPlayerControl(0)
    Api::SetHudVisible(0)
    Api::RemoveFromParty("cyclops")
    this.fe0 = 0
    this.fe4 = 0
    this.fdc = 0
    Api::SetObjective(0x3b, 0, 1)   // obj: Switch to Cyclops and proceed to the next room
    Api::SetObjective(0x3c, 0, 1)   // obj: Switch to Wolverine and proceed to the final room
    sub_100a3e58(this, 1, ?, ?)
    goto L_100a4c04
  L_100a4a84:
    goto L_100a4b50
  L_100a4abc:
    Api::Teleport("wolverine", 0x9f6, 0x1162, 2)
    Api::Teleport("cyclops", 0x92e, 0x109a, 6)
    Api::FadeIn(this, 0)
    this.fdc = 2
    goto L_100a4c04
  L_100a4b28:
  L_100a4b50:
    Api::StartDialogue("switchfail2", this, fn_100a4c20, 0)   // dlg tutorial: X-Computer: You must change your team leader to Wolverine.  Press and hold the character select key ('8') foll ... results=0
    goto L_100a4c04
  L_100a4b68:
    Api::FadeOut(this, fn_100a4c10)
    goto L_100a4c04
  L_100a4b94:
    Api::Teleport("wolverine", 0x9f6, 0x1162, 2)
    Api::Teleport("cyclops", 0x92e, 0x109a, 6)
    Api::FadeIn(this, 0)
    this.fdc = 3
    goto L_100a4c04
  L_100a4c04:
    return
  L_100a4c10:
    ret_FadeIn[0xdc] = (ret_FadeIn[0xdc] + 1)
    goto L_100a47a8
    goto L_100a4c10

func fn_100a4c24  // HANDLER for "switchdoor1","switchdoor2"
    cmp this.fe0, 0
    goto_ne L_100a4c84
    cmp evt[0x8], 0
    goto_ne L_100a4c84
    Entity::GetName(evt[0x0], )
    strcmp(ret_GetName, )
    cmp ret_strcmp, 0
    goto_ne L_100a4c74
    this.fe0 = 1
    sub_100a4c10(this, ?, ?, 1)
    goto L_100a4c84
  L_100a4c74:
    this.fdc = 0x63
    sub_100a47a8(this, ?, ?, 0x63)
  L_100a4c84:
    return

func fn_100a4c8c  // HANDLER for "switchbackdoor1","switchbackdoor2","switchbackdoor3","switchbackdoor4"
    cmp this.fe4, 0
    goto_ne L_100a4cec
    cmp evt[0x8], 0
    goto_ne L_100a4cec
    Entity::GetName(evt[0x0], )
    strcmp(ret_GetName, )
    cmp ret_strcmp, 0
    goto_ne L_100a4cdc
    this.fe4 = 1
    sub_100a4c10(this, ?, ?, 1)
    goto L_100a4cec
  L_100a4cdc:
    this.fdc = 0xc7
    sub_100a47a8(this, ?, ?, 0xc7)
  L_100a4cec:
    return

func fn_100a4cf4  // HANDLER for "tut3a"
    cmp evt[0x8], 0
    goto_ne L_100a4d60
    cmp this.f11c, 0
    goto_ne L_100a4d58
    Api::StartDialogue("Barriers", this, fn_100a4d6c, this.f11c)
    goto L_100a4d60
  L_100a4d58:
    ?[0x11c] = 0
  L_100a4d60:
    return

func fn_100a4d6c  // 
    cmp evt, 0
    goto_eq L_100a4dbc
    Api::FadeOut(this, fn_100a4dc4)
    Api::SetObjective(0x30, 0, 1)   // obj: Select a training program
    goto L_100a4dbc
  L_100a4dbc:
    return

func fn_100a4dc4  // 
    cmp this.fe8, 9
    switch(this.fe8) -> jumptable at 0x100a4de0
    goto L_100a513c
  L_100a4e08:
    this.fc8 = 0
    Api::CameraFollowPlayer(0x1000)
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0x1162, 0x1162, 2)
    Api::FadeIn(this, fn_100a5148)
    goto L_100a513c
  L_100a4e74:
    goto L_100a5040
  L_100a4eac:
    Api::CameraPanTo(0x1130, 0x1004, 0x2ff)
    goto L_100a5040
  L_100a4f04:
    Api::AddObjective(0x35, 1)   // obj: Destroy breakable wall
    Api::SetPlayerControl(1)
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 0)
    Api::CameraFollowPlayer(0x2ff)
    goto L_100a513c
  L_100a4f50:
    Api::SetObjective(0x35, 2, 1)   // obj: Destroy breakable wall
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 1)
    goto L_100a5040
  L_100a4f9c:
    Api::CameraPanTo(0x10fe, 0xd16, 0x2ff)
    goto L_100a5040
  L_100a4ff4:
    Api::CameraFollowPlayer(0x2ff)
    Api::AddObjective(0x36, 1)   // obj: Disable forcefield
    goto L_100a513c
  L_100a5018:
  L_100a5040:
    Api::StartDialogue("barriersfinal", this, fn_100a5158, 0)   // dlg tutorial: X-Computer: This concludes the destroyable walls and forcefields training simulation. ... results=0
    goto L_100a513c
  L_100a5058:
    Api::SetPlayerControl(0)
    Api::FadeOut(this, fn_100a5148)
    goto L_100a513c
  L_100a5090:
    Api::MapSet0([&sp_8] api, 0x2c, 0x21)
    Api::MapSet8(0x2c, 0x21, 0)
    Api::MapSet6(0x2c, 0x29)
    Api::MapSet6(0x2b, 0x29)
    Api::MapSet6(0x2d, 0x29)
    this.fe8 = 0
    this.ff8 = 0
    this.fec = 0
    this.ff0 = 0
    this.ff4 = 0
    Api::SetObjective(0x35, 0, 1)   // obj: Destroy breakable wall
    Api::SetObjective(0x36, 0, 1)   // obj: Disable forcefield
    sub_100a3e58(this, 2, ?, ?)
  L_100a513c:
    return
  L_100a5148:
    ret_sub_100a3e58[0xe8] = (ret_sub_100a3e58[0xe8] + 1)
    goto L_100a4dc4
    goto L_100a5148

func fn_100a515c  // HANDLER for "map"
    cmp this.fec, 0
    goto_ne L_100a521c
    cmp evt[0x8], 6
    goto_ne L_100a521c
    this.fec = 1
    Api::MapSet0([this] api, 0x2c, 0x29)
    Api::SpawnEmitter("debris1", "metal", 0x1130, 0x1004, this.fec, 3)
    Api::SpawnEmitter("dust1", "dust", 0x1130, 0x1004, this.fec, 3)
    Api::PlaySound("exploding_wall_02", 0x1a, this.fec)
    sub_100a5148(this, ?, ?, ?)
    goto L_100a521c
  L_100a521c:
    return

func fn_100a5228  // HANDLER for "forcefield1a","forcefield1b","forcefield1c","forcefield1d"
    cmp this.ff8, 0
    goto_ne L_100a52f0
    cmp evt[0x8], 2
    goto_eq L_100a5290
    goto_hi L_100a525c
    cmp evt[0x8], 0
    goto_eq L_100a5268
    goto L_100a52f0
  L_100a525c:
    cmp evt[0x8], 3
    goto_eq L_100a527c
    goto L_100a52f0
  L_100a5268:
    Api::ShowMessage(0x32, 1)   // text: Disable Forcefield?
    goto L_100a52f0
  L_100a527c:
    Api::ShowMessage(0x32, 0)   // text: Disable Forcefield?
    goto L_100a52f0
  L_100a5290:
    Api::ClearMessages()
    Api::ShowPopupText(0x33)   // text: Forcefield Disabled
    this.ff8 = 1
    Api::MapSet0([&sp_4] api, 0x2c, 0x21)
    Api::MapSet8(0x2c, 0x21, 1)
    Api::SetObjective(0x36, 2, 1)   // obj: Disable forcefield
  L_100a52f0:
    return
    cmp ret_SetObjective[0xf0], 0
    return
    cmp ?[0x8], 0
    return
    ret_SetObjective[0xf0] = 1
    goto L_100a5148
    cmp ret_SetObjective[0xf4], 0
    return
    cmp ?[0x8], 0
    return
    ret_SetObjective[0xf4] = 1
    goto L_100a5148

func fn_100a5344  // HANDLER for "tut4c"
    cmp evt[0x8], 0
    goto_ne L_100a53b0
    cmp this.f120, 0
    goto_ne L_100a53a8
    Api::StartDialogue("Items", this, fn_100a53bc, this.f120)
    goto L_100a53b0
  L_100a53a8:
    ?[0x120] = 0
  L_100a53b0:
    return

func fn_100a53bc  // 
    cmp evt, 0
    goto_eq L_100a540c
    Api::FadeOut(this, fn_100a5414)
    Api::SetObjective(0x30, 0, 1)   // obj: Select a training program
    goto L_100a540c
  L_100a540c:
    return

func fn_100a5414  // 
    cmp this.f100, 8
    switch(this.f100) -> jumptable at 0x100a5430
    goto L_100a576c
  L_100a5454:
    this.fc8 = 0
    Script::GetPartyMemberId(0)
    Api::TeleportId(ret_GetPartyMemberId, 0xe42, 0x2ee, 2)
    Api::CameraPanTo(0xe42, 0x28a, 0x1000)
    Api::FadeIn(this, fn_100a5778)
    goto L_100a576c
  L_100a54cc:
    Api::ClearMessages()
    goto L_100a568c
  L_100a550c:
    Api::CameraFollowPlayer(0x2ff)
    Api::SetPlayerControl(1)
    Script::StartTimer(3, 0x7d0, 0)
    Api::AddObjective(0x37, 1)   // obj: Pick up item
    goto L_100a576c
  L_100a5550:
    Api::SetObjective(0x37, 2, 0)   // obj: Pick up item
    Api::ClearMessages()
    goto L_100a568c
  L_100a55a4:
    Script::GetPartyMemberId(0)
    Api::SetHealthId(ret_GetPartyMemberId, 0x21)
    goto L_100a568c
  L_100a55f8:
    Api::AddObjective(0x38, 1)   // obj: Use item
    Api::SetCinematicMode(1, 0)
    Script::StartTimer(1, 0x6d6, 0)
    goto L_100a576c
  L_100a5634:
    Script::GetPartyMemberId(0)
    Api::SetHealthId(ret_GetPartyMemberId, 0x203)
    Api::SetObjective(0x38, 2, 1)   // obj: Use item
  L_100a568c:
    Api::StartDialogue("items4", this, fn_100a5788, 0)   // dlg tutorial: X-Computer: And now your health is fully restored. ... results=0
    goto L_100a576c
  L_100a56a8:
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::FadeOut(this, fn_100a5778)
    goto L_100a576c
  L_100a56f0:
    sub_100a3e58(this, 3, ?, ?)
    Api::SetObjective(0x37, 0, 1)   // obj: Pick up item
    Api::SetObjective(0x38, 0, 1)   // obj: Use item
    Api::SpawnEntity("item0", "…", 2, 0xe63, 0x22d, 0, 0)
    this.f100 = 0
    goto L_100a576c
  L_100a576c:
    return
  L_100a5778:
    ret_SpawnEntity[0x100] = (ret_SpawnEntity[0x100] + 1)
    goto L_100a5414
    goto L_100a5778

func fn_100a578c  // 
    Api::HasItem("…")
    tst ret_HasItem, 0xff
    goto_ne L_100a57b8
    sub_100a5778(this, ?, ?, ?)
    goto L_100a57cc
  L_100a57b8:
    Script::StartTimer(1, 0x3e8, 0)
  L_100a57cc:
    return

func fn_100a57d4  // 
    Api::HasItem("…")
    tst ret_HasItem, 0xff
    goto_eq L_100a5800
    sub_100a5778(this, ?, ?, ?)
    goto L_100a5814
  L_100a5800:
    Script::StartTimer(3, 0x3e8, 0)
  L_100a5814:
    return

func fn_100a581c  // HANDLER for "tut5c"
    cmp evt[0x8], 0
    goto_ne L_100a5888
    cmp this.f124, 0
    goto_ne L_100a5880
    Api::StartDialogue("Specials", this, fn_100a5894, this.f124)
    goto L_100a5888
  L_100a5880:
    ?[0x124] = 0
  L_100a5888:
    return

func fn_100a5894  // 
    cmp evt, 0
    goto_eq L_100a58ec
    this.f104 = 0
    Api::FadeOut(this, fn_100a58f4)
    Api::SetObjective(0x30, 0, 1)   // obj: Select a training program
    goto L_100a58ec
  L_100a58ec:
    return

func fn_100a58f4  // 
    cmp this.f104, 9
    switch(this.f104) -> jumptable at 0x100a5910
    goto L_100a5d34
  L_100a5938:
    this.fc8 = 0
    Api::Teleport("wolverine", 0x1932, 0x1162, 2)
    Api::Teleport("cyclops", 0x186a, 0xb22, 7)
    Api::CameraFollowPlayer(0x1000)
    Api::SetCinematicMode(1, 0)
    Api::FadeIn(this, fn_100a5d40)
    goto L_100a5d34
  L_100a59d8:
    goto L_100a5be0
  L_100a5a10:
    Api::AddObjective(0x32, 1)   // obj: Proceed to the next room
    Api::SetPlayerControl(1)
    goto L_100a5d34
  L_100a5a30:
    Api::SetObjective(0x32, 2, 1)   // obj: Proceed to the next room
    Api::StartDialogue("specials2", this, 0, 0)   // dlg tutorial: X-Computer: Each X-man has at most 4 different special attacks that he or she can perform. ... results=0
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 0)
    Api::SetUIFlag27(0)
    Api::AddObjective(0x39, 1)   // obj: Use Wolverine's special to kill the drone
    goto L_100a5d34
  L_100a5aa4:
    Api::SetHudVisible(0)
    Api::StartDialogue("specials3", this, 0, 0)   // dlg tutorial: X-Computer: Good job.  Proceed to the next room to learn more about special attacks. ... results=0
    Api::SetObjective(0x39, 2, 1)   // obj: Use Wolverine's special to kill the drone
    goto L_100a5d34
  L_100a5ae8:
    Api::AddObjective(0x3a, 1)   // obj: Use Cyclop's special to kill the dummy
    goto L_100a5be0
  L_100a5b30:
    Api::AddToParty("cyclops")
    Api::WalkToTile("cyclops", 0x3f, 0x1d, -1)
    Api::StartDialogue("specials5", this, 0, 0)   // dlg tutorial: X-Computer: Now, stand a few blocks away. The dummy has been programmed to attack if you get too close, so you ... results=0
    Api::SetEnemy("brawler4")
    goto L_100a5d34
  L_100a5b90:
    cmp this.f10c, 0
    if(ne) Api::SetHudVisible([(ne? api : ret_SetEnemy)] (ne? 0 : ?))
    Api::SetObjective(0x3a, 2, 1)   // obj: Use Cyclop's special to kill the dummy
  L_100a5be0:
    Api::StartDialogue("specialsend", this, fn_100a5d50, 0)   // dlg tutorial: X-Computer: Excellent work, X-men. ... results=0
    goto L_100a5d34
  L_100a5bf8:
    Script::GetPartyMemberId(0)
    Api::SetActionPromptId(ret_GetPartyMemberId, 1)
    Script::GetPartyMemberId(1)
    Api::SetActionPromptId(ret_GetPartyMemberId, 1)
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    Api::SetUIFlag27(1)
    Api::FadeOut(this, fn_100a5d40)
    goto L_100a5d34
  L_100a5c84:
    this.f104 = 0
    this.f110 = 0
    this.f108 = 0
    this.f10c = 0
    Api::SetHealth("brawler3", 0x10)
    Api::SetNeutral("brawler4")
    Api::SetHealth("brawler4", 0x10)
    Api::Post15PartySlot(0)
    Api::SetObjective(0x32, 0, 1)   // obj: Proceed to the next room
    Api::SetObjective(0x39, 0, 1)   // obj: Use Wolverine's special to kill the drone
    Api::SetObjective(0x3a, 0, 1)   // obj: Use Cyclop's special to kill the dummy
    Api::RemoveFromParty("cyclops")
    sub_100a3e58(this, 4, ?, ?)
    goto L_100a5d34
  L_100a5d34:
    return
  L_100a5d40:
    ret_sub_100a3e58[0x104] = (ret_sub_100a3e58[0x104] + 1)
    goto L_100a58f4
    goto L_100a5d40

func fn_100a5d54  // HANDLER for "brawler3","brawler4"
    cmp this.f108, 0
    goto_ne L_100a5d84
    cmp evt[0x8], 0
    goto_ne L_100a5e0c
    this.f108 = 1
    sub_100a5d40(this, evt, arg2, 1)
    goto L_100a5e0c
  L_100a5d84:
    cmp this.f10c, 0
    goto_ne L_100a5dd0
    cmp this.f104, 6
    goto_ne L_100a5dd0
    cmp ?[0x8], 0
    goto_ne L_100a5dd0
    Api::SetHudVisible(1)
    this.f10c = 1
    Api::MakePartyTarget("brawler4")
    goto L_100a5e0c
  L_100a5dd0:
    cmp ?[0x8], 4
    goto_ne L_100a5e0c
    cmp this.f104, 3
    cmpne this.f104, 6
    goto_ne L_100a5e0c
    Api::SetHudVisible(1)
    Script::StartTimer(2, 0x3e8, 0)
  L_100a5e0c:
    return

func fn_100a5e14  // HANDLER for "specialroom1","specialroom2"
    cmp this.f110, 0
    goto_ne L_100a5e4c
    cmp this.f104, 4
    goto_ne L_100a5e4c
    cmp evt[0x8], 0
    goto_ne L_100a5e4c
    sub_100a5d40(this, evt, arg2, evt[0x8])
    this.f110 = 1
  L_100a5e4c:
    return

func fn_100a5e54  // HANDLER for "player0"
    cmp evt[0x8], 4
    goto_ne L_100a5e98
    Entity::GetId(evt[0x0], )
    Api::SetAllyId(ret_GetId)
    Entity::GetId(evt[0x0], )
    Api::SetHealthId(ret_GetId, 0x190)
  L_100a5e98:
    return
```
