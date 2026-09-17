import { dv } from './pkg.js';

// .dlg dialogue trees: "DLG00000", labels (cstr + u32 node), u32 node count,
// nodes: i32 parent, i32 sibling, i32 child, u8 kind; 0 line (wstr speaker, wstr text, cstr voice, cstr portrait),
// 1 choice (wstr text, cstr voice), 2 goto (cstr label), 3 end (i32 result)
export function parseDialogue(bytes) {
  const d = dv(bytes);
  let p = 8;
  const i32 = () => { const v = d.getInt32(p, true); p += 4; return v; };
  const cstr = () => { let s = ''; while (bytes[p]) s += String.fromCharCode(bytes[p++]); p++; return s; };
  const wstr = () => { let s = ''; while (bytes[p] | bytes[p + 1]) { s += String.fromCharCode(bytes[p] | bytes[p + 1] << 8); p += 2; } p += 2; return s; };
  const labels = new Map();
  for (let n = i32(); n > 0; n--) { const name = cstr(); labels.set(name.toLowerCase(), i32()); }
  const nodes = [];
  for (let n = i32(); n > 0; n--) {
    const node = { parent: i32(), sibling: i32(), child: i32(), kind: bytes[p++] };
    if (node.kind === 0) { node.speaker = wstr(); node.text = wstr(); node.voice = cstr(); node.portrait = cstr(); }
    else if (node.kind === 1) { node.text = wstr(); node.voice = cstr(); }
    else if (node.kind === 2) node.jump = cstr();
    else node.result = i32();
    nodes.push(node);
  }
  return { labels, nodes };
}
