class Miselanius {
  public base64ToBlob(base64: string, contentType: string) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  groupByMap<T, K>(array: T[], keyFn: (item: T) => K): Map<K, T[]> {
    const map = new Map<K, T[]>();

    for (const item of array) {
      const key = keyFn(item);
      map.set(key, [...(map.get(key) ?? []), item]);
    }

    return map;
  }

  selectDistinct<T, K>(array: T[], keyFn: (item: T) => K): K[] {
    return Array.from(new Set(array.map(keyFn)));
  }
}

export default Miselanius;
