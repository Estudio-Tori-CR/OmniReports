import Encript from "./Encript";

export default class Miselanius {
  public GenerateRandomPassword() {
    const randomNumber = Math.floor(Math.random() * 100000);
    const password = randomNumber.toString().padStart(5, "0");
    return {
      hash: new Encript().Hash(password),
      password,
    };
  }

  private parseISO(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) throw new Error(`Invalid ISO date: ${iso}`);
    return d;
  }
  private pad2 = (n: number) => {
    return n.toString().padStart(2, "0");
  };

  public toOracleDateTimeString(iso: string, includeHour: boolean = true) {
    const d = new Date(iso);

    // Validación
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid ISO date: ${iso}`);
    }

    const yyyy = d.getFullYear();
    const mm = this.pad2(d.getMonth() + 1);
    const dd = this.pad2(d.getDate());

    if (includeHour) {
      const hh = this.pad2(d.getHours());
      const mi = this.pad2(d.getMinutes());
      const ss = this.pad2(d.getSeconds());

      return `TO_DATE('${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}', 'YYYY-MM-DD HH24:MI:SS')`;
    }

    return `TO_DATE('${yyyy}-${mm}-${dd}', 'YYYY-MM-DD')`;
  }

  public toMySqlDateTimeString(iso: string, includeHour: boolean = true) {
    const d = this.parseISO(iso);
    const yyyy = d.getFullYear();
    const mm = this.pad2(d.getMonth() + 1);
    const dd = this.pad2(d.getDate());

    if (includeHour) {
      const hh = this.pad2(d.getHours());
      const mi = this.pad2(d.getMinutes());
      const ss = this.pad2(d.getSeconds());
      return `STR_TO_DATE('${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}', '%Y-%m-%d %H:%i:%s')`;
    }

    return `STR_TO_DATE('${yyyy}-${mm}-${dd}', '%Y-%m-%d')`;
  }

  public toSqlServerDateTimeString(iso: string, includeHour: boolean = true) {
    const d = this.parseISO(iso);
    const yyyy = d.getFullYear();
    const mm = this.pad2(d.getMonth() + 1);
    const dd = this.pad2(d.getDate());

    if (includeHour) {
      const hh = this.pad2(d.getHours());
      const mi = this.pad2(d.getMinutes());
      const ss = this.pad2(d.getSeconds());
      return `CONVERT(datetime, '${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}', 120)`;
    }

    return `CONVERT(datetime, '${yyyy}-${mm}-${dd}', 23)`;
  }
}
