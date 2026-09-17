# Mission script `demo2`

Map: `map=map14_arb_mid.btm records=16 startInv=0`

Dialogue slots: 

## Class / handler table
```
// mission demo2: factory 0x100a6bd8, ctor 0x100a6ba0, vtable 0x1011d30c
//   vtable[2] = 0x100a6bc8 (dtor)
//   vtable[3] = 0x100a6c00 (Init/RegisterHandlers)
//   vtable[4] = 0x100a70d0 (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a6bfc
//   "Player0" -> fn_100a7e84
//   "Player1" -> fn_100a7f3c
//   "Player2" -> fn_100a7f6c
//   "Player3" -> fn_100a7f9c
//   "Character0" -> fn_100a7fcc
//   "character1" -> fn_100a8024
//   "character2" -> fn_100a807c
//   "character3" -> fn_100a80ac
//   "character4" -> fn_100a80dc
//   "character5" -> fn_100a810c
//   "character6" -> fn_100a813c
//   "character7" -> fn_100a816c
//   "character8" -> fn_100a819c
//   "character9" -> fn_100a81cc
//   "character10" -> fn_100a81fc
//   "character11" -> fn_100a822c
//   "character12" -> fn_100a825c
//   "character13" -> fn_100a828c
//   "trigger1" -> fn_100a828c
```

## Objectives referenced


## Transitions / progression


## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/demo2.txt)
```js
func fn_100a6ba0  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d30c
    goto L_100a6bc0
  L_100a6bc0:
    return
    this.fc4 = 0x1011d30c
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d30c)

func fn_100a6bd8  // 
    operator_new(0xd8, )
    cmp ret_operator_new, 0
    if(ne) sub_100a6ba0(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a6c00  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(0x14)
    Script::RegisterHandler("NULL", fn_100a6bfc)
    Script::RegisterHandler("Player0", fn_100a7e84)
    Script::RegisterHandler("Player1", fn_100a7f3c)
    Script::RegisterHandler("Player2", fn_100a7f6c)
    Script::RegisterHandler("Player3", fn_100a7f9c)
    Script::RegisterHandler("Character0", fn_100a7fcc)
    Script::RegisterHandler("character1", fn_100a8024)
    Script::RegisterHandler("character2", fn_100a807c)
    Script::RegisterHandler("character3", fn_100a80ac)
    Script::RegisterHandler("character4", fn_100a80dc)
    Script::RegisterHandler("character5", fn_100a810c)
    Script::RegisterHandler("character6", fn_100a813c)
    Script::RegisterHandler("character7", fn_100a816c)
    Script::RegisterHandler("character8", fn_100a819c)
    Script::RegisterHandler("character9", fn_100a81cc)
    Script::RegisterHandler("character10", fn_100a81fc)
    Script::RegisterHandler("character11", fn_100a822c)
    Script::RegisterHandler("character12", fn_100a825c)
    Script::RegisterHandler("character13", fn_100a828c)
    goto L_100a7020
  L_100a7020:
    Script::RegisterHandler("trigger1", fn_100a82bc)
    Script::SetTimerCallback(0, fn_100a730c)
    Script::SetTimerCallback(1, fn_100a82fc)
    this.fc8 = 0
    this.fcc = 0
    this.fd0 = 0
    this.fd4 = 0
    Script::SetVarBC()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    goto L_100a70c4
  L_100a70c4:
    return

func fn_100a70d0  // VTABLE OnStart
    Api::MapSet0([&sp_4] api, 0x46, 0x28)
    Api::MapSet0([&sp_4] api, 0x45, 0x28)
    Api::MapSet0([&sp_4] api, 0x44, 0x28)
    Api::MapSet0([&sp_4] api, 0x43, 0x28)
    Api::MapSet0([&sp_4] api, 0x42, 0x28)
    Api::MapSet0([&sp_4] api, 0x41, 0x30)
    Api::MapSet0([&sp_4] api, 0x42, 0x30)
    Api::MapSet0([&sp_4] api, 0x43, 0x30)
    Api::MapSet0([&sp_4] api, 0x44, 0x30)
    Api::MapSet0([&sp_4] api, 0x45, 0x30)
    Api::MapSet0([&sp_4] api, 0x46, 0x30)
    Api::MapSet0([&sp_4] api, 0x47, 0x30)
    Api::MapSet0([&sp_4] api, 0x48, 0x30)
    Api::MapSet0([&sp_4] api, 0x49, 0x30)
    Api::MapSet0([&sp_4] api, 0x4a, 0x30)
    Api::MapSet0([&sp_4] api, 0x4b, 0x30)
    Script::GetPartyMemberId(0)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Script::GetPartyMemberId(1)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Script::GetPartyMemberId(2)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Script::GetPartyMemberId(3)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Api::Lvl38_Fx()
    Script::GetPartyMemberId(0)
    Api::CameraFollowEntityId(ret_GetPartyMemberId, 0x1000)
    sub_100a7320(this, ?, ?, ?)
    return
  L_100a730c:
    ret_sub_100a7320[0xc8] = (ret_sub_100a7320[0xc8] + 1)
    goto L_100a7320
    goto L_100a730c

func fn_100a7320  // 
    Script::StartTimer(1, 0x3a98, 0)
    cmp this.fc8, 0x16
    switch(this.fc8) -> jumptable at 0x100a734c
    goto L_100a7e78
  L_100a73ac:
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d7e, 0x11c6, 2)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1de2, 0x11c6, 2)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x1e46, 0x11c6, 2)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x1de2, 0x120c, 2)
    goto L_100a7e78
  L_100a7458:
    Api::SetHudVisible(0)
    this.fd0 = 0
    Api::CameraPanTo(0x1de2, 0x1068, 0x2ff)
    Script::StartTimer(0, 0xc8, 0)
    goto L_100a7e78
  L_100a74a4:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("Character0", ret_GetPartyMemberId)
    goto L_100a7e24
  L_100a74d4:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character1", ret_GetPartyMemberId)
    goto L_100a7e24
  L_100a7508:
    Script::GetPartyMemberId(0)
    Api::CameraFollowEntityId(ret_GetPartyMemberId, 0x2ff)
    Api::WalkTo("Character0", 0x1a5e, 0x10fe, -1)
    Api::WalkTo("character1", 0x1a5e, 0x10fe, -1)
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x1b26, 0x11c6, 4)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1aa9, 0x1211, 4)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x1adb, 0x11c6, 4)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x1b8a, 0x11c6, 4)
    goto L_100a7e78
  L_100a761c:
    Api::MapSet0([&sp_4] api, 0x47, 0x2c)
    Api::MapSet0([&sp_4] api, 0x47, 0x2d)
    Api::MapSet0([&sp_4] api, 0x47, 0x2e)
    Api::MapSet0([&sp_4] api, 0x47, 0x2f)
    Api::MapSet0([&sp_4] api, 0x48, 0x2c)
    Api::MapSet0([&sp_4] api, 0x48, 0x2d)
    Api::MapSet0([&sp_4] api, 0x48, 0x2e)
    Api::MapSet0([&sp_4] api, 0x48, 0x2f)
    Api::SetHudVisible(1)
    this.fd4 = 0
    Api::WalkTo("Character0", 0x1c52, 0x122a, -1)
    Api::WalkTo("character1", 0x1c52, 0x122a, -1)
    goto L_100a7e78
  L_100a7740:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d1a, 0xbb8, 2)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d7e, 0xbb8, 2)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d1a, 0xc1c, 2)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d7e, 0xc1c, 2)
    goto L_100a7e78
  L_100a77ec:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d1a, 0x514, 2)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1cb6, 0x4e2, 1)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d7e, 0x546, 2)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x1d1a, 0x4e2, 2)
    goto L_100a7e78
  L_100a78a4:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x2134, 0x41a, 0)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x2134, 0x47e, 0)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x2134, 0x3b6, 0)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x20da, 0x41a, 0)
    goto L_100a7e78
  L_100a7954:
    this.fcc = 0
    sub_100a730c(this, ?, ?, 0)
    goto L_100a7e78
  L_100a7968:
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x249f, 0x979, 5)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x24d1, 0x9f6, 4)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x24ea, 0x992, 4)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x24c2, 0xa5a, 3)
    goto L_100a7e78
  L_100a7a28:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x2102, 0x915, 2)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x20d0, 0x960, 1)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x2166, 0x992, 3)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x217f, 0x915, 4)
    goto L_100a7e78
  L_100a7ae8:
    goto L_100a7e24
  L_100a7af8:
    Api::CameraPanTo(0x2008, 0x9c4, 0x1000)
    goto L_100a7e24
  L_100a7b24:
    Api::CameraPanTo(0x19c8, 0x9c4, 0x50)
    Api::FadeIn(this, 0)
    goto L_100a7e24
  L_100a7b64:
    Api::ShowPopupText(0x33)   // text: Forcefield Disabled
    Api::MapSet4(0x50, 0x1b)
    Api::MapSet4(0x50, 0x1a)
    Api::MapSet4(0x50, 0x19)
    Api::MapSet4(0x50, 0x18)
    Api::MapSet0([&sp_4] api, 0x50, 0x1b)
    Api::MapSet0([&sp_4] api, 0x50, 0x1a)
    Api::MapSet0([&sp_4] api, 0x50, 0x19)
    Api::MapSet0([&sp_4] api, 0x50, 0x18)
    Script::StartTimer(0, 0xabe, 0)
    goto L_100a7e78
  L_100a7c34:
    Api::ShowPopupText(0x33)   // text: Forcefield Disabled
    Api::MapSet4(0x46, 0x1b)
    Api::MapSet4(0x46, 0x1a)
    Api::MapSet4(0x46, 0x19)
    Api::MapSet4(0x46, 0x18)
    Api::MapSet0([&sp_4] api, 0x46, 0x1b)
    Api::MapSet0([&sp_4] api, 0x46, 0x1a)
    Api::MapSet0([&sp_4] api, 0x46, 0x19)
    Api::MapSet0([&sp_4] api, 0x46, 0x18)
    Api::FadeOut(this, fn_100a730c)
    goto L_100a7e78
  L_100a7d14:
    Api::CameraPanTo(0x20d0, 0x8fc, 0x1000)
    goto L_100a7e24
  L_100a7d40:
    Script::GetPartyMemberId(0)
    Api::CameraFollowEntityId(ret_GetPartyMemberId, 0x2ff)
    Api::FadeIn(this, 0)
    goto L_100a7e24
  L_100a7d84:
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x1806, 0x992, 4)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1806, 0x9f6, 4)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x1806, 0xa5a, 4)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x17a2, 0x9f6, 4)
  L_100a7e24:
    Script::StartTimer(0, 0x7d0, 0)
    goto L_100a7e78
  L_100a7e44:
    Api::FadeOut(this, fn_100a730c)
    goto L_100a7e78
  L_100a7e70:
    Api::Post0_Sub15_A()
  L_100a7e78:
    return

func fn_100a7e84  // HANDLER for "Player0"
    cmp evt[0x8], 5
    goto_ne L_100a7f34
    cmp this.fc8, 6
    goto_eq L_100a7ed8
    goto_gt L_100a7eb4
    cmp this.fc8, 0
    goto_eq L_100a7ec0
    goto L_100a7f34
  L_100a7eb4:
    cmp this.fc8, 0xb
    goto_eq L_100a7f2c
    goto L_100a7f34
  L_100a7ec0:
    ; orr r3, r3, #1
    this.fd0 = ?
    cmp ?, 0xf
    goto_ne L_100a7f34
    goto L_100a7f2c
  L_100a7ed8:
    Api::MakePartyTarget("character2")
    Api::MakePartyTarget("character3")
    Api::MakePartyTarget("character4")
    Api::MakePartyTarget("character5")
    Api::MakePartyTarget("character6")
    goto L_100a7f34
  L_100a7f2c:
    sub_100a730c(this, ?, ?, ?)
  L_100a7f34:
    return
    cmp ?[0x8], 5
    return
    cmp ret_sub_100a730c[0xc8], 0
    return
    ; orr r3, r3, #2
    ret_sub_100a730c[0xd0] = ?
    cmp ?, 0xf
    return
    goto L_100a730c
    cmp ?[0x8], 5
    return
    cmp ret_sub_100a730c[0xc8], 0
    return
    ; orr r3, r3, #4
    ret_sub_100a730c[0xd0] = ?
    cmp ?, 0xf
    return
    goto L_100a730c
    cmp ?[0x8], 5
    return
    cmp ret_sub_100a730c[0xc8], 0
    return
    ; orr r3, r3, #8
    ret_sub_100a730c[0xd0] = ?
    cmp ?, 0xf
    return
    goto L_100a730c
    cmp ?[0x8], 4
    goto_eq L_100a8004
    cmp ?[0x8], 5
    return
    cmp ret_sub_100a730c[0xc8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a730c[0xd4] = ?
    cmp ?, 3
  L_100a7ffc:
    return
    goto L_100a730c
  L_100a8004:
    ; orr r3, r3, #1
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 3
    return
    cmp ret_sub_100a730c[0xc8], 5
    goto L_100a7ffc
    cmp ?[0x8], 4
    goto_eq L_100a805c
    cmp ?[0x8], 5
    return
    cmp ret_sub_100a730c[0xc8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a730c[0xd4] = ?
    cmp ?, 3
  L_100a8054:
    return
    goto L_100a730c
  L_100a805c:
    ; orr r3, r3, #2
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 3
    return
    cmp ret_sub_100a730c[0xc8], 5
    goto L_100a8054
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 0x1f
    return
    cmp ret_sub_100a730c[0xc8], 6
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 0x1f
    return
    cmp ret_sub_100a730c[0xc8], 6
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #4
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 0x1f
    return
    cmp ret_sub_100a730c[0xc8], 6
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #8
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 0x1f
    return
    cmp ret_sub_100a730c[0xc8], 6
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x10
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 0x1f
    return
    cmp ret_sub_100a730c[0xc8], 6
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 3
    return
    cmp ret_sub_100a730c[0xc8], 7
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 3
    return
    cmp ret_sub_100a730c[0xc8], 7
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 3
    return
    cmp ret_sub_100a730c[0xc8], 8
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 3
    return
    cmp ret_sub_100a730c[0xc8], 8
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 7
    return
    cmp ret_sub_100a730c[0xc8], 0xa
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 7
    return
    cmp ret_sub_100a730c[0xc8], 0xa
    return
    goto L_100a730c
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #4
    ret_sub_100a730c[0xcc] = ?
    cmp ?, 7
    return
    cmp ret_sub_100a730c[0xc8], 0xa
    return
    goto L_100a730c
    cmp ?[0x8], 0
    return
    ret_sub_100a730c[0xc8] = 0x17
    tailcall Api::FadeOut(r0=ret_sub_100a730c[0x0], ret_sub_100a730c, -0x10000, fn_100a730c)
    tailcall Api::Post0_Sub15_A(r0=ret_sub_100a730c[0x0][0x0], ret_sub_100a730c, -0x10000, fn_100a730c)
```
