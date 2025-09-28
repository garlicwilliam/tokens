export function checkTwitterName(name: string): boolean {
  const regex: RegExp = /STONE\u{1f426}\u{200d}\u{2b1b}\u{1faa8}/u;
  return regex.test(name);
}
