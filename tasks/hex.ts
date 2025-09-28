function arrayBufferToHex(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    return Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function intToArrayBuffer(num: number): ArrayBuffer {
    const buffer = new ArrayBuffer(4); // 创建一个长度为4字节的ArrayBuffer
    const view = new DataView(buffer);
    view.setInt32(0, num, true); // 写入整数，使用大端字节序（Big Endian）
    return buffer;
}

function hexStringToArrayBuffer(hexString: string) {
    const length = hexString.length / 2;
    const buffer = new ArrayBuffer(length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < length; i++) {
        view[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return buffer;
}

function arrayBufferToInt32LE(buffer: ArrayBuffer) {
    const view = new DataView(buffer);
    return view.getInt32(0, true); // 读取整数，使用小端字节序（Little Endian）
}

function intToHex(num: number): string {
    return arrayBufferToHex(intToArrayBuffer(num))
}

export function hexToInt(hexString: string) {
    if(hexString.startsWith('0x')) {
        hexString = hexString.slice(2);
    }

    return arrayBufferToInt32LE(hexStringToArrayBuffer(hexString));
}

const i = hexToInt('0x18990100')
const j = hexToInt('0x19990100')

console.log(i);
console.log(j);
