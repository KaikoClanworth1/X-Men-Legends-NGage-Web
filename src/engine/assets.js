import { Pkg } from '../formats/pkg.js';
import { Sprite } from '../formats/spr.js';
import { parseTileset } from '../formats/map.js';
import { parseCharacters, parseItems, parseStrings } from '../formats/data.js';

// Central asset access with decode caches. The game's data is supplied by the user at runtime.
export class Assets {
  constructor(buffer) {
    this.pkg = new Pkg(buffer);
    this.sprites = new Map();
    this.tilesets = new Map();
    this.strings = new Map();
  }
  has(name) { return this.pkg.has(name); }
  bytes(name) { return this.pkg.get(name); }
  sprite(name) {
    const key = name.toLowerCase();
    if (!this.sprites.has(key)) {
      this.sprites.set(key, this.pkg.has(name) ? this.pkg.get(name).then(b => new Sprite(b, name)) : Promise.resolve(null));
    }
    return this.sprites.get(key);
  }
  async tileset(name) {
    const key = name.toLowerCase();
    if (!this.tilesets.has(key)) {
      this.tilesets.set(key, (async () => {
        const ts = parseTileset(await this.pkg.get(name));
        ts.image = await this.sprite(ts.sprite);
        return ts;
      })());
    }
    return this.tilesets.get(key);
  }
  async text(name, lang = '') {
    const file = lang ? name.replace('.txt', `_${lang}.txt`) : name;
    if (!this.strings.has(file)) this.strings.set(file, this.pkg.get(file).then(parseStrings));
    return this.strings.get(file);
  }
  async loadTables() {
    this.characters = parseCharacters(await this.pkg.get('characters.cdt'));
    this.items = parseItems(await this.pkg.get('items.idf'));
  }
}
