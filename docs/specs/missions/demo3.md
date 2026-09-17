# Mission script `demo3`

Map: `map=map23_sent_2.btm records=34 startInv=0`

Dialogue slots: 

## Class / handler table
```
// mission demo3: factory 0x100a833c, ctor 0x100a8304, vtable 0x1011d324
//   vtable[2] = 0x100a832c (dtor)
//   vtable[3] = 0x100a8364 (Init/RegisterHandlers)
//   vtable[4] = 0x100a87fc (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a8360
//   "Player0" -> fn_100a919c
//   "Player1" -> fn_100a9204
//   "Player2" -> fn_100a926c
//   "Player3" -> fn_100a92e8
//   "Character0" -> fn_100a9350
//   "character1" -> fn_100a9380
//   "character2" -> fn_100a93b0
//   "character3" -> fn_100a93e0
//   "character4" -> fn_100a9410
//   "character5" -> fn_100a9440
//   "character6" -> fn_100a9470
//   "character7" -> fn_100a94a0
//   "character8" -> fn_100a94d0
//   "character9" -> fn_100a9500
//   "character10" -> fn_100a9530
//   "character11" -> fn_100a9560
//   "character12" -> fn_100a9590
//   "character13" -> fn_100a95c0
```

## Objectives referenced


## Transitions / progression


## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/demo3.txt)
```js
func fn_100a8304  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d324
    goto L_100a8324
  L_100a8324:
    return
    this.fc4 = 0x1011d324
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d324)

func fn_100a833c  // 
    operator_new(0xd4, )
    cmp ret_operator_new, 0
    if(ne) sub_100a8304(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a8364  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(0x13)
    Script::RegisterHandler("NULL", fn_100a8360)
    Script::RegisterHandler("Player0", fn_100a919c)
    Script::RegisterHandler("Player1", fn_100a9204)
    Script::RegisterHandler("Player2", fn_100a926c)
    Script::RegisterHandler("Player3", fn_100a92e8)
    Script::SetTimerCallback(0, fn_100a88a4)
    Script::SetTimerCallback(1, fn_100a95f4)
    Script::RegisterHandler("Character0", fn_100a9350)
    Script::RegisterHandler("character1", fn_100a9380)
    Script::RegisterHandler("character2", fn_100a93b0)
    Script::RegisterHandler("character3", fn_100a93e0)
    Script::RegisterHandler("character4", fn_100a9410)
    Script::RegisterHandler("character5", fn_100a9440)
    Script::RegisterHandler("character6", fn_100a9470)
    Script::RegisterHandler("character7", fn_100a94a0)
    Script::RegisterHandler("character8", fn_100a94d0)
    Script::RegisterHandler("character9", fn_100a9500)
    Script::RegisterHandler("character10", fn_100a9530)
    Script::RegisterHandler("character11", fn_100a9560)
    Script::RegisterHandler("character12", fn_100a9590)
    goto L_100a8784
  L_100a8784:
    Script::RegisterHandler("character13", fn_100a95c0)
    Script::SetVarBC()
    Api::SetCinematicMode(0, 0)
    Api::SetPlayerControl(0)
    this.fc8 = 0
    this.fcc = 0
    this.fd0 = 0
    goto L_100a87f0
  L_100a87f0:
    return

func fn_100a87fc  // VTABLE OnStart
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
    sub_100a88b4(this, ?, ?, ?)
    return
  L_100a88a4:
    ret_sub_100a88b4[0xc8] = (ret_sub_100a88b4[0xc8] + 1)
    goto L_100a88b4

func fn_100a88b4  // 
    Script::StartTimer(1, 0x3a98, 0)
    cmp this.fc8, 0x18
    switch(this.fc8) -> jumptable at 0x100a88e0
    goto L_100a9190
  L_100a8948:
    Api::FadeIn(this, 0)
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x992, 0x992, 3)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x92e, 0x9f6, 3)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x9f6, 0x92e, 3)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x9f6, 0x9f6, 3)
    goto L_100a9190
  L_100a8a00:
    this.fd0 = 0
    goto L_100a8ce8
  L_100a8a20:
    Api::CameraPanTo(0x5aa, 0x992, 7)
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character3", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8a6c:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character4", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8a9c:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character5", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8acc:
    Api::CameraPanTo(0xa1f, 0x5ff, 0x2ff)
    goto L_100a9148
  L_100a8afc:
    Api::CameraPanTo(0xa8c, 0x5aa, 7)
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("Character0", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8b48:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character1", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8b78:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character2", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8ba8:
    Script::GetPartyMemberId(0)
    Api::CameraFollowEntityId(ret_GetPartyMemberId, 0x2ff)
    Api::MakePartyTarget("Character0")
    Api::MakePartyTarget("character1")
    Api::MakePartyTarget("character2")
    Api::MakePartyTarget("character3")
    Api::MakePartyTarget("character4")
    Api::MakePartyTarget("character5")
    goto L_100a9190
  L_100a8c2c:
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x79e, 0x79e, 4)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x802, 0x73a, 2)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x73a, 0x802, 4)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x802, 0x802, 2)
    goto L_100a9190
  L_100a8cd4:
    this.fd0 = 0
  L_100a8ce8:
    Api::CameraPanTo(0x762, 0x316, 0x2ff)
    Script::StartTimer(0, 0x3e8, 0)
    goto L_100a9190
  L_100a8d14:
    Api::CameraPanTo(0x76c, 0x258, 7)
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character9", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8d5c:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character13", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8d8c:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character11", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8dbc:
    Api::CameraPanTo(0x215, 0x7d0, 0x2ff)
    goto L_100a9148
  L_100a8de8:
    Api::CameraPanTo(0x1c2, 0x81b, 7)
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character6", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8e34:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character8", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8e64:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character7", ret_GetPartyMemberId)
    goto L_100a9148
  L_100a8e94:
    Script::GetPartyMemberId(0)
    Api::CameraFollowEntityId(ret_GetPartyMemberId, 0x2ff)
    Api::MakePartyTarget("character6")
    Api::MakePartyTarget("character7")
    Api::MakePartyTarget("character8")
    Api::MakePartyTarget("character9")
    Api::MakePartyTarget("character10")
    Api::MakePartyTarget("character11")
    Api::MakePartyTarget("character12")
    Api::MakePartyTarget("character13")
    goto L_100a9190
  L_100a8f38:
    this.fc8 = 0x16
    sub_100a95f0(this, ?, ?, 0x16)
    goto L_100a9190
  L_100a8f4c:
    Api::Teleport("character14", 0x9c4, 0x9c4, 3)
    Api::Teleport("character15", 0xa28, 0xa28, 3)
    Api::Teleport("character16", 0xa8c, 0xa8c, 3)
    Api::Teleport("character17", 0xb54, 0xaf0, 3)
    Api::Teleport("character18", 0xaf0, 0xb54, 3)
    Api::Teleport("character19", 0xbb8, 0xbb8, 3)
    Api::Teleport("character20", 0xc80, 0xbb8, 3)
    Api::Teleport("character21", 0xc1c, 0xc80, 3)
    Api::Teleport("character22", 0xce4, 0xd48, 3)
    Api::Teleport("character23", 0xc80, 0xc1c, 3)
    Api::MakePartyTarget("character14")
    Api::MakePartyTarget("character15")
    Api::MakePartyTarget("character16")
    Api::MakePartyTarget("character17")
    Api::MakePartyTarget("character18")
    Api::MakePartyTarget("character19")
    Api::MakePartyTarget("character20")
    Api::MakePartyTarget("character21")
    Api::MakePartyTarget("character22")
    Api::MakePartyTarget("character23")
    Api::CameraPanTo(0x992, 0x992, 0x1000)
    goto L_100a9148
  L_100a9128:
    Api::CameraPanTo(0xbea, 0xbea, 7)
  L_100a9148:
    Script::StartTimer(0, 0xdac, 0)
    goto L_100a9190
  L_100a915c:
    Api::FadeOut(this, fn_100a88a4)
    goto L_100a9190
  L_100a9188:
    Api::Post0_Sub15_A()
  L_100a9190:
    return
    cmp ?[0x8], 5
    return
    cmp ret_Post0_Sub15_A[0xc8], 0
    goto_eq L_100a91c0
    cmp ret_Post0_Sub15_A[0xc8], 0xa
    goto_eq L_100a91e4
    return
  L_100a91c0:
    ; orr r3, r3, #1
    ret_Post0_Sub15_A[0xd0] = ?
    cmp ?, 0xf
    return
    cmp ret_Post0_Sub15_A[0xc8], 0
  L_100a91dc:
    return
    goto L_100a88a4
  L_100a91e4:
    ; orr r3, r3, #1
    ret_Post0_Sub15_A[0xd0] = ?
    cmp ?, 0xf
    return
    cmp ret_Post0_Sub15_A[0xc8], 0xa
    goto L_100a91dc
    cmp ?[0x8], 5
    return
    cmp ret_Post0_Sub15_A[0xc8], 0
    goto_eq L_100a9228
    cmp ret_Post0_Sub15_A[0xc8], 0xa
    goto_eq L_100a924c
    return
  L_100a9228:
    ; orr r3, r3, #2
    ret_Post0_Sub15_A[0xd0] = ?
    cmp ?, 0xf
    return
    cmp ret_Post0_Sub15_A[0xc8], 0
  L_100a9244:
    return
    goto L_100a88a4
  L_100a924c:
    ; orr r3, r3, #2
    ret_Post0_Sub15_A[0xd0] = ?
    cmp ?, 0xf
    return
    cmp ret_Post0_Sub15_A[0xc8], 0xa
    goto L_100a9244

func fn_100a926c  // HANDLER for "Player2"
    cmp evt[0x8], 5
    goto_ne L_100a92e0
    cmp this.fc8, 0
    goto_eq L_100a9298
    cmp this.fc8, 0xa
    goto_eq L_100a92bc
    goto L_100a92e0
  L_100a9298:
    ; orr r3, r3, #4
    this.fd0 = ?
    cmp ?, 0xf
    goto_ne L_100a92bc
    cmp this.fc8, 0
    if(eq) sub_100a88a4((eq? this : this), evt, arg2, this.fc8)
  L_100a92bc:
    ; orr r3, r3, #4
    this.fd0 = ?
    cmp ?, 0xf
    goto_ne L_100a92e0
    cmp this.fc8, 0xa
    if(eq) sub_100a88a4((eq? this : ret_sub_100a88a4), ?, ?, this.fc8)
  L_100a92e0:
    return
    cmp ?[0x8], 5
    return
    cmp ret_sub_100a88a4[0xc8], 0
    goto_eq L_100a930c
    cmp ret_sub_100a88a4[0xc8], 0xa
    goto_eq L_100a9330
    return
  L_100a930c:
    ; orr r3, r3, #8
    ret_sub_100a88a4[0xd0] = ?
    cmp ?, 0xf
    return
    cmp ret_sub_100a88a4[0xc8], 0
  L_100a9328:
    return
    goto L_100a88a4
  L_100a9330:
    ; orr r3, r3, #8
    ret_sub_100a88a4[0xd0] = ?
    cmp ?, 0xf
    return
    cmp ret_sub_100a88a4[0xc8], 0xa
    goto L_100a9328
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0x3f
    return
    cmp ret_sub_100a88a4[0xc8], 9
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0x3f
    return
    cmp ret_sub_100a88a4[0xc8], 9
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #4
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0x3f
    return
    cmp ret_sub_100a88a4[0xc8], 9
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #8
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0x3f
    return
    cmp ret_sub_100a88a4[0xc8], 9
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x10
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0x3f
    return
    cmp ret_sub_100a88a4[0xc8], 9
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x20
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0x3f
    return
    cmp ret_sub_100a88a4[0xc8], 9
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #1
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #2
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #4
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #8
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x10
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x20
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x40
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    cmp ?[0x8], 4
    return
    ; orr r3, r3, #0x80
    ret_sub_100a88a4[0xcc] = ?
    cmp ?, 0xff
    return
    cmp ret_sub_100a88a4[0xc8], 0x13
    return
    goto L_100a88a4
    goto L_100a88a4
    tailcall Api::Post0_Sub15_A(r0=ret_sub_100a88a4[0x0], ?, ?, ret_sub_100a88a4[0xc8])

func fn_100a95fc  // operator_new
    GetGlobalGame(this, )
    cmp ret_GetGlobalGame[0x18], 0
    goto_eq L_100a9624
    GetGlobalGame(ret_GetGlobalGame[0x18], )
    sub_100b2e80(ret_GetGlobalGame[0x18], this, ?, ?)
  L_100a9624:
    return

func fn_100a962c  // 
    GetGlobalGame(this, )
    cmp ret_GetGlobalGame[0x18], 0
    goto_eq L_100a9654
    GetGlobalGame(ret_GetGlobalGame[0x18], )
    sub_100b2e80(ret_GetGlobalGame[0x18], this, ?, ?)
  L_100a9654:
    return

func fn_100a965c  // 
    GetGlobalGame(this, )
    cmp ret_GetGlobalGame[0x18], 0
    goto_eq L_100a968c
    cmp this, 0
    goto_eq L_100a968c
    GetGlobalGame(ret_GetGlobalGame, )
    sub_100b30b4(ret_GetGlobalGame[0x18], this, ?, ?)
  L_100a968c:
    return

func fn_100a9694  // 
    GetGlobalGame(this, )
    cmp ret_GetGlobalGame[0x18], 0
    goto_eq L_100a96c4
    cmp this, 0
    goto_eq L_100a96c4
    GetGlobalGame(ret_GetGlobalGame, )
    sub_100b30b4(ret_GetGlobalGame[0x18], this, ?, ?)
  L_100a96c4:
    return

func fn_100a96cc  // 
    sub_100b14b0(this, 0xf, arg2, ?r3)
    this.fc = 0x1011d8fc
    this.f10 = 0
    this.f14 = 0
    goto L_100a96fc
  L_100a96fc:
    return

func fn_100a9704  // 
    sub_100b14b0(this, 0xf, arg2, ?r3)
    this.fc = 0x1011d8fc
    this.f10 = 0
    this.f14 = 0
    sub_100a9760(&sp_4, this, evt, arg2)
    goto L_100a9754
  L_100a9754:
    return
```
