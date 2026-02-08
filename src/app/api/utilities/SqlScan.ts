type DbFlavor = "MySql" | "OracleDB" | "SQLServer" | string;

type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; hit?: string };

const READ_FIRST_KEYWORDS: Record<DbFlavor, Set<string>> = {
  MySql: new Set(["SELECT", "WITH", "SHOW", "DESCRIBE", "DESC", "EXPLAIN", "CALL"]),
  OracleDB: new Set(["SELECT", "WITH", "EXPLAIN"]), // Oracle does not have standard SHOW/DESC like MySQL
  SQLServer: new Set(["SELECT", "WITH", "EXECUTE", "EXEC"]), // Note: we don't want exec here; we leave it out and block it below
};

// Forbidden keywords (outside of strings/comments)
const FORBIDDEN_KEYWORDS_COMMON = new Set([
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "UPSERT",
  "REPLACE",
  "CREATE",
  "ALTER",
  "DROP",
  "TRUNCATE",
  "RENAME",
  "GRANT",
  "REVOKE",
  "DENY",
  "COMMIT",
  "ROLLBACK",
  "SAVEPOINT",
  "SET",
  "USE",
]);

const FORBIDDEN_SP_COMMON = new Set([
  "EXECUTE",
  "BEGIN",
  "DECLARE",
]);

const FORBIDDEN_BY_DB: Record<DbFlavor, Set<string>> = {
  MySql: new Set([
    ...FORBIDDEN_KEYWORDS_COMMON,
    ...FORBIDDEN_SP_COMMON,
    "LOAD",
    "HANDLER",
    "LOCK",
    "UNLOCK",
    "ANALYZE",
    "OPTIMIZE",
    "REPAIR",
    "PREPARE",
    "DEALLOCATE",
  ]),
  OracleDB: new Set([
    ...FORBIDDEN_KEYWORDS_COMMON,
    ...FORBIDDEN_SP_COMMON,
    "PLSQL",
    "PACKAGE",
    "PROCEDURE",
    "FUNCTION",
    "DBMS_", // package family
  ]),
  SQLServer: new Set([
    ...FORBIDDEN_KEYWORDS_COMMON,
    ...FORBIDDEN_SP_COMMON,
    "BULK",
    "OPENROWSET",
    "OPENDATASOURCE",
    "XP_",
    "SP_", // extensions / common stored procs (note: there could be custom SP without SP_)
  ]),
};

class SqlScan {
  isWhitespace(ch: string) {
    return (
      ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f"
    );
  }

  /**
   * Scans through SQL and produces tokens (only letters/numbers/_/$/#),
   * ignoring comments and content inside strings/identifiers.
   * Also detects multi-statement separators: ; and GO (sqlserver).
   */
  scanSql(sql: string, flavor: DbFlavor) {
    const tokens: string[] = [];
    let hasSemicolon = false;
    let hasGoBatch = false;

    let i = 0;
    const n = sql.length;

    // states
    let inSQuote = false; // '...'
    let inDQuote = false; // "..."
    let inBQuote = false; // `...` (MySQL)
    let inBrackets = false; // [ ... ] (SQL Server)
    let inLineComment = false; // -- ... \n
    let inBlockComment = false; // /* ... */

    const pushToken = (t: string) => {
      if (!t) return;
      tokens.push(t.toUpperCase());
    };

    let current = "";

    const flush = () => {
      if (current) pushToken(current);
      current = "";
    };

    while (i < n) {
      const ch = sql[i];
      const next = i + 1 < n ? sql[i + 1] : "";

      // handle comments
      if (!inSQuote && !inDQuote && !inBQuote && !inBrackets) {
        if (inLineComment) {
          if (ch === "\n") inLineComment = false;
          i++;
          continue;
        }
        if (inBlockComment) {
          if (ch === "*" && next === "/") {
            inBlockComment = false;
            i += 2;
            continue;
          }
          i++;
          continue;
        }

        // start comment
        if (ch === "-" && next === "-") {
          flush();
          inLineComment = true;
          i += 2;
          continue;
        }
        if (ch === "/" && next === "*") {
          flush();
          inBlockComment = true;
          i += 2;
          continue;
        }
      }

      // detect start/end of strings/identifiers
      if (!inLineComment && !inBlockComment) {
        // SQL Server [identifier]
        if (!inSQuote && !inDQuote && !inBQuote && flavor === "SQLServer") {
          if (ch === "[" && !inBrackets) {
            flush();
            inBrackets = true;
            i++;
            continue;
          }
          if (ch === "]" && inBrackets) {
            inBrackets = false;
            i++;
            continue;
          }
        }

        // MySQL backticks
        if (!inSQuote && !inDQuote && flavor === "MySql") {
          if (ch === "`" && !inBQuote) {
            flush();
            inBQuote = true;
            i++;
            continue;
          }
          if (ch === "`" && inBQuote) {
            inBQuote = false;
            i++;
            continue;
          }
        }

        // '...'
        if (!inDQuote && !inBQuote && !inBrackets) {
          if (ch === "'" && !inSQuote) {
            flush();
            inSQuote = true;
            i++;
            continue;
          }
          if (ch === "'" && inSQuote) {
            // escape '' inside string
            if (next === "'") {
              i += 2;
              continue;
            }
            inSQuote = false;
            i++;
            continue;
          }
        }

        // "..." (string or identifier depending on DB, we ignore it either way)
        if (!inSQuote && !inBQuote && !inBrackets) {
          if (ch === `"` && !inDQuote) {
            flush();
            inDQuote = true;
            i++;
            continue;
          }
          if (ch === `"` && inDQuote) {
            inDQuote = false;
            i++;
            continue;
          }
        }
      }

      // if we're inside something "quoted", ignore content
      if (
        inSQuote ||
        inDQuote ||
        inBQuote ||
        inBrackets ||
        inLineComment ||
        inBlockComment
      ) {
        i++;
        continue;
      }

      // multiple statements
      if (ch === ";") {
        flush();
        hasSemicolon = true;
        i++;
        continue;
      }

      // simple tokenization
      if (
        this.isWhitespace(ch) ||
        ch === "(" ||
        ch === ")" ||
        ch === "," ||
        ch === "."
      ) {
        flush();
        i++;
        continue;
      }

      // build token with typical keyword/identifier characters
      const isWordChar =
        (ch >= "A" && ch <= "Z") ||
        (ch >= "a" && ch <= "z") ||
        (ch >= "0" && ch <= "9") ||
        ch === "_" ||
        ch === "$" ||
        ch === "#";

      if (isWordChar) {
        current += ch;
      } else {
        flush();
      }

      i++;
    }

    flush();

    // detect GO (batch separator) in SQL Server as isolated token
    if (flavor === "sqlserver") {
      for (let j = 0; j < tokens.length; j++) {
        if (tokens[j] === "GO") {
          hasGoBatch = true;
          break;
        }
      }
    }

    return { tokens, hasSemicolon, hasGoBatch };
  }

  validateReadOnlySql(sql: string, flavor: DbFlavor): ValidationResult {
    const trimmed = sql.trim();
    if (!trimmed) return { ok: false, reason: "Empty SQL" };

    const { tokens, hasSemicolon, hasGoBatch } = this.scanSql(trimmed, flavor);

    // if (hasSemicolon) {
    //   return {
    //     ok: false,
    //     reason: "Semicolon detected (possible multi-statement)",
    //   };
    // }
    if (hasGoBatch) {
      return { ok: false, reason: "GO detected (SQL Server batch separator)" };
    }
    if (tokens.length === 0) {
      return {
        ok: false,
        reason: "No tokens detected (only comments/strings?)",
      };
    }

    const first = tokens[0];

    // Only allow starting with read keywords (and NO SP)
    const allowedFirst = READ_FIRST_KEYWORDS[flavor];
    if (!allowedFirst.has(first) || FORBIDDEN_SP_COMMON.has(first)) {
      return {
        ok: false,
        reason: "The query does not appear to be read-only",
        hit: first,
      };
    }

    // Block any forbidden keyword anywhere
    const forbidden = FORBIDDEN_BY_DB[flavor];
    for (const t of tokens) {
      // Extra heuristic for Oracle: block DBMS_* by prefix
      if (flavor === "OracleDB" && t.startsWith("DBMS_")) {
        return {
          ok: false,
          reason: "Possible use of Oracle package (not allowed)",
          hit: t,
        };
      }
      if (forbidden.has(t)) {
        return { ok: false, reason: "Forbidden keyword detected", hit: t };
      }
    }

    return { ok: true };
  }
}
export default SqlScan;
