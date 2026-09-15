/** Just enough PNG to read pixels back out of a render, for tests that check layout. */
import { inflateSync } from "node:zlib";

export type Pixels = {
  width: number;
  height: number;
  channels: number;
  data: Buffer;
};

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

export function decodePng(png: Buffer): Pixels {
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Buffer[] = [];

  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    const type = png.subarray(at + 4, at + 8).toString("latin1");
    const body = png.subarray(at + 8, at + 8 + length);

    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const colorType = body[9];

      if (body[8] !== 8) throw new Error(`unsupported bit depth ${body[8]}`);
      if (body[12] !== 0) throw new Error("interlaced PNGs are not supported");

      channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType as 0 | 2 | 4 | 6] ?? 0;
      if (channels === 0) throw new Error(`unsupported colour type ${colorType}`);
    }

    if (type === "IDAT") idat.push(Buffer.from(body));
    if (type === "IEND") break;

    at += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const data = Buffer.alloc(stride * height);

  // Each scanline is prefixed with the filter used to encode it (PNG spec 9.2).
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const from = y * (stride + 1) + 1;
    const to = y * stride;

    for (let x = 0; x < stride; x++) {
      const value = raw[from + x];
      const left = x >= channels ? data[to + x - channels] : 0;
      const up = y > 0 ? data[to - stride + x] : 0;
      const upLeft = x >= channels && y > 0 ? data[to - stride + x - channels] : 0;

      const restored =
        filter === 0
          ? value
          : filter === 1
            ? value + left
            : filter === 2
              ? value + up
              : filter === 3
                ? value + ((left + up) >> 1)
                : value + paeth(left, up, upLeft);

      data[to + x] = restored & 0xff;
    }
  }

  return { width, height, channels, data };
}

/** Leftmost column holding a pixel the predicate accepts. */
export function firstColumn(pixels: Pixels, matches: (r: number, g: number, b: number) => boolean) {
  for (let x = 0; x < pixels.width; x++) {
    for (let y = 0; y < pixels.height; y++) {
      const at = (y * pixels.width + x) * pixels.channels;
      if (matches(pixels.data[at], pixels.data[at + 1], pixels.data[at + 2])) return x;
    }
  }

  return -1;
}
