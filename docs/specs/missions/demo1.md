# Mission script `demo1`

Map: `map=map07_sew_a.btm records=22 startInv=0`

Dialogue slots: 

## Class / handler table
```
// mission demo1: factory 0x100a5ed8, ctor 0x100a5ea0, vtable 0x1011d2f4
//   vtable[2] = 0x100a5ec8 (dtor)
//   vtable[3] = 0x100a5f00 (Init/RegisterHandlers)
//   vtable[4] = 0x100a616c (OnStart)
//   vtable[5] = 0x10027d5c (OnLoaded)
// handler registrations (record name -> handler):
//   "NULL" -> fn_100a5efc
//   "Character0" -> fn_100a69e8
//   "character1" -> fn_100a6a1c
//   "character3" -> fn_100a6a50
//   "character5" -> fn_100a6a88
//   "character4" -> fn_100a6ac0
//   "character6" -> fn_100a6af8
//   "character23" -> fn_100a6b30
//   "character24" -> fn_100a6b64
```

## Objectives referenced


## Transitions / progression


## Pseudocode (auto-lifted; `this.fXX` = mission state fields, evt.code: 0 enter,2 action,3 exit,4 defeated,5 walk done,6 wall destroyed,7 pickup; `?` = value not tracked, see lift/demo1.txt)
```js
func fn_100a5ea0  // 
    Script::ctor(evt)
    this.fc4 = 0x1011d2f4
    goto L_100a5ec0
  L_100a5ec0:
    return
    this.fc4 = 0x1011d2f4
    tailcall Script::dtor(r0=this, ?, ?, 0x1011d2f4)

func fn_100a5ed8  // 
    operator_new(0xd4, )
    cmp ret_operator_new, 0
    if(ne) sub_100a5ea0(ret_operator_new, (ne? this : ?), ?, ?)
    return
    return

func fn_100a5f00  // VTABLE Init/RegisterHandlers
    Script::ReserveHandlers(9)
    Script::RegisterHandler("NULL", fn_100a5efc)
    Script::RegisterHandler("Character0", fn_100a69e8)
    Script::RegisterHandler("character1", fn_100a6a1c)
    Script::RegisterHandler("character3", fn_100a6a50)
    Script::RegisterHandler("character5", fn_100a6a88)
    Script::RegisterHandler("character4", fn_100a6ac0)
    Script::RegisterHandler("character6", fn_100a6af8)
    Script::RegisterHandler("character23", fn_100a6b30)
    Script::RegisterHandler("character24", fn_100a6b64)
    Script::SetTimerCallback(0, fn_100a6234)
    Script::SetTimerCallback(1, fn_100a6b98)
    this.fc8 = 0
    this.fcc = 0
    this.fd0 = 0
    Script::SetVarBC()
    goto L_100a6160
  L_100a6160:
    return

func fn_100a616c  // VTABLE OnStart
    Api::SetPlayerControl(0)
    Script::GetPartyMemberId(0)
    Api::CameraFollowEntityId(ret_GetPartyMemberId, 0x1000)
    Api::SetCinematicMode(0, 0)
    Script::GetPartyMemberId(0)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Script::GetPartyMemberId(1)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Script::GetPartyMemberId(2)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Script::GetPartyMemberId(3)
    Api::SetFieldF0Id(ret_GetPartyMemberId, 3)
    Api::Lvl38_Fx()
    sub_100a6248(this, ?, ?, ?)
    return
  L_100a6234:
    ret_sub_100a6248[0xc8] = (ret_sub_100a6248[0xc8] + 1)
    goto L_100a6248
    goto L_100a6234

func fn_100a6248  // 
    Script::StartTimer(1, 0x3a98, 0)
    cmp this.fc8, 0x17
    switch(this.fc8) -> jumptable at 0x100a6274
    goto L_100a69dc
  L_100a62d8:
    Api::FadeIn(this, 0)
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x1770, 0x11c6, 3)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1770, 0x1162, 3)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x17ac, 0x1234, 3)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x1806, 0x11c6, 3)
    goto L_100a69dc
  L_100a639c:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x141e, 0xe42, 4)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x1450, 0xdde, 4)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x13ec, 0xed8, 4)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x1482, 0xe74, 4)
    goto L_100a69dc
  L_100a6458:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0x122a, 0xb86, 4)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0x11ad, 0xb9f, 4)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0x1284, 0xb68, 4)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0x128e, 0xbb8, 4)
    goto L_100a69dc
  L_100a6514:
    this.fcc = 0
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0xe10, 0xa5a, 3)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0xe10, 0xaf0, 3)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0xe5b, 0xaa5, 3)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0xea6, 0xa5a, 3)
    goto L_100a69dc
  L_100a65c0:
    this.fd0 = 1
    goto L_100a699c
  L_100a65d8:
    Api::SetHudVisible(0)
    Api::ScreenFx3_CameraReset()
    Script::GetPartyMemberId(0)
    Api::WalkToId(ret_GetPartyMemberId, 0xd48, 0x7d0, 1)
    Script::GetPartyMemberId(1)
    Api::WalkToId(ret_GetPartyMemberId, 0xd16, 0x802, 1)
    Script::GetPartyMemberId(2)
    Api::WalkToId(ret_GetPartyMemberId, 0xdac, 0x834, 1)
    Script::GetPartyMemberId(3)
    Api::WalkToId(ret_GetPartyMemberId, 0xd05, 0x820, 1)
    goto L_100a69a8
  L_100a669c:
    Api::CameraPanTo(0xfd2, 0x60e, 0x1000)
    goto L_100a699c
  L_100a66c8:
    Api::CameraPanTo(0xce4, 0x708, 0x60)
    Api::FadeIn(this, fn_100a6234)
    goto L_100a69dc
  L_100a6710:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character27", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6740:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("…", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6770:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character26", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a67a0:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character22", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a67d0:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character25", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6800:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character21", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6830:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character20", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6860:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character8", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6894:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character19", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a68c4:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character18", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a68f4:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character17", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6924:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character16", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6954:
    Script::GetPartyMemberId(0)
    Api::FaceEntityNameId("character7", ret_GetPartyMemberId)
    goto L_100a699c
  L_100a6984:
    Api::SetHudVisible(1)
  L_100a699c:
    Script::StartTimer(0, 0x3e8, 0)
    goto L_100a69dc
  L_100a69a8:
    Api::FadeOut(this, fn_100a6234)
    goto L_100a69dc
  L_100a69d4:
    Api::Post0_Sub15_A()
  L_100a69dc:
    return
    cmp ?[0x8], 4
    ; orreq r3, r3, #1
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    ret_Post0_Sub15_A[0xc8] = 0
    tailcall Script::StartTimer(r0=ret_Post0_Sub15_A, 0, 0xc8, 0)
    cmp 0[0x8], 4
    ; orreq r3, r3, #2
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    ret_Post0_Sub15_A[0xc8] = 0
    tailcall Script::StartTimer(r0=ret_Post0_Sub15_A, 0, 0xc8, 0)
    cmp 0[0x8], 4
    ; orreq r3, r3, #1
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    ret_Post0_Sub15_A[0xc8] = 1
    tailcall Script::StartTimer(r0=ret_Post0_Sub15_A, 0, 0xc8, 0)
    cmp 0[0x8], 4
    ; orreq r3, r3, #2
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    ret_Post0_Sub15_A[0xc8] = 1
    tailcall Script::StartTimer(r0=ret_Post0_Sub15_A, 0, 0xc8, 0)
    cmp 0[0x8], 4
    ; orreq r3, r3, #1
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    ret_Post0_Sub15_A[0xc8] = 2
    tailcall Script::StartTimer(r0=ret_Post0_Sub15_A, 0, 0xc8, 0)
    cmp 0[0x8], 4
    ; orreq r3, r3, #2
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    ret_Post0_Sub15_A[0xc8] = 2
    tailcall Script::StartTimer(r0=ret_Post0_Sub15_A, 0, 0xc8, 0)
    cmp 0[0x8], 4
    ; orreq r3, r3, #1
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    cmp ret_Post0_Sub15_A[0xd0], 0
    return
    ret_Post0_Sub15_A[0xc8] = ret_Post0_Sub15_A[0xcc]
    goto L_100a6234
    cmp 0[0x8], 4
    ; orreq r3, r3, #2
    if(eq) ret_Post0_Sub15_A[0xcc] = ?
    cmp ret_Post0_Sub15_A[0xcc], 3
    return
    cmp ret_Post0_Sub15_A[0xd0], 0
    return
    ret_Post0_Sub15_A[0xc8] = ret_Post0_Sub15_A[0xcc]
    goto L_100a6234
    tailcall Api::Post0_Sub15_A(r0=ret_Post0_Sub15_A[0x0], 0, ret_Post0_Sub15_A[0xcc], ret_Post0_Sub15_A[0xd0])
```
