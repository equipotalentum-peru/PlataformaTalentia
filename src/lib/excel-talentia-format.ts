type TalentiaExcelStyle = {
  font?: {
    name?: string;
    sz?: number;
    bold?: boolean;
    italic?: boolean;
    color?: { rgb: string };
  };
  fill?: {
    patternType?: "solid" | "none";
    fgColor?: { rgb: string };
    bgColor?: { rgb: string };
  };
  alignment?: {
    horizontal?: "left" | "center" | "right";
    vertical?: "top" | "center" | "bottom";
    wrapText?: boolean;
  };
  border?: Partial<Record<"top" | "bottom" | "left" | "right", {
    style: "thin" | "medium";
    color: { rgb: string };
  }>>;
};

type TalentiaExcelCell = {
  v?: unknown;
  t?: string;
  s?: TalentiaExcelStyle;
  z?: string;
};

type TalentiaExcelSheet = Record<string, unknown>;
type RowInfo = { hpt?: number; hpx?: number; hidden?: boolean; level?: number };

export type TalentiaExcelStyleOptions = {
  totalColumns: number;
  titleRow: number;
  metadataRows: number[];
  headerRow: number;
  firstDataRow: number;
  lastDataRow: number;
  highlightColumns?: number[];
};

const COLORS = {
  navy: "0B2E63",
  blue: "2D7BD0",
  teal: "00B7B4",
  metadata: "E8F7FA",
  rowAlternate: "F1FAFC",
  white: "FFFFFF",
  bodyText: "173963",
  metadataText: "496581",
  border: "D8E7F2",
  summaryFill: "DDF7F1",
  summaryText: "126B5B",
};

const borderThin = {
  top: { style: "thin" as const, color: { rgb: COLORS.border } },
  bottom: { style: "thin" as const, color: { rgb: COLORS.border } },
  left: { style: "thin" as const, color: { rgb: COLORS.border } },
  right: { style: "thin" as const, color: { rgb: COLORS.border } },
};

function columnName(index: number): string {
  let number = index + 1;
  let label = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    number = Math.floor((number - 1) / 26);
  }
  return label;
}

function cellAddress(row: number, column: number): string {
  return `${columnName(column)}${row + 1}`;
}

/** Aplica el mismo estilo Talentia a los archivos Excel exportados por docente y administrador. */
export function aplicarEstilosExcelTalentia(
  sheet: TalentiaExcelSheet,
  options: TalentiaExcelStyleOptions,
): void {
  const columnCount = Math.max(1, options.totalColumns);

  const setCellStyle = (row: number, column: number, style: TalentiaExcelStyle) => {
    const address = cellAddress(row, column);
    const existing = sheet[address];
    const cell: TalentiaExcelCell = existing && typeof existing === "object"
      ? existing as TalentiaExcelCell
      : { t: "s", v: "" };
    cell.s = { ...(cell.s ?? {}), ...style };
    sheet[address] = cell;
  };

  const fillRow = (row: number, style: TalentiaExcelStyle) => {
    for (let column = 0; column < columnCount; column += 1) {
      setCellStyle(row, column, style);
    }
  };

  // Título con la franja azul marino de Talentia.
  fillRow(options.titleRow, {
    font: { name: "Aptos", sz: 18, bold: true, color: { rgb: COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.navy } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: { bottom: { style: "medium", color: { rgb: COLORS.teal } } },
  });

  // Metadatos en azul muy claro, diferenciados visualmente de la tabla.
  for (const row of options.metadataRows) {
    fillRow(row, {
      font: { name: "Aptos", sz: 10, color: { rgb: COLORS.metadataText } },
      fill: { patternType: "solid", fgColor: { rgb: COLORS.metadata } },
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: { bottom: { style: "thin", color: { rgb: COLORS.border } } },
    });
  }

  // Encabezado azul, texto blanco y línea inferior turquesa.
  fillRow(options.headerRow, {
    font: { name: "Aptos", sz: 11, bold: true, color: { rgb: COLORS.white } },
    fill: { patternType: "solid", fgColor: { rgb: COLORS.blue } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: COLORS.blue } },
      bottom: { style: "medium", color: { rgb: COLORS.teal } },
      left: { style: "thin", color: { rgb: COLORS.white } },
      right: { style: "thin", color: { rgb: COLORS.white } },
    },
  });

  // Resalta columnas resumen (nota/promedio/porcentaje) además de las indicadas explícitamente.
  const highlightColumns = new Set(options.highlightColumns ?? []);
  for (let column = 0; column < columnCount; column += 1) {
    const headerCell = sheet[cellAddress(options.headerRow, column)] as TalentiaExcelCell | undefined;
    const heading = String(headerCell?.v ?? "");
    if (/promedio|nota|porcentaje/i.test(heading)) highlightColumns.add(column);
  }

  const lastDataRow = options.lastDataRow;
  for (let row = options.firstDataRow; row <= lastDataRow; row += 1) {
    const rowFill = (row - options.firstDataRow) % 2 === 0 ? COLORS.white : COLORS.rowAlternate;
    for (let column = 0; column < columnCount; column += 1) {
      const address = cellAddress(row, column);
      const cell = sheet[address] as TalentiaExcelCell | undefined;
      const isHighlighted = highlightColumns.has(column);
      const isNumber = typeof cell?.v === "number";
      setCellStyle(row, column, {
        font: {
          name: "Aptos",
          sz: 10,
          bold: isHighlighted,
          color: { rgb: isHighlighted ? COLORS.summaryText : COLORS.bodyText },
        },
        fill: {
          patternType: "solid",
          fgColor: { rgb: isHighlighted ? COLORS.summaryFill : rowFill },
        },
        alignment: {
          horizontal: isNumber ? "center" : "left",
          vertical: "center",
          wrapText: true,
        },
        border: borderThin,
      });
    }
  }

  const rows = (sheet["!rows"] as RowInfo[] | undefined) ?? [];
  rows[options.titleRow] = { ...(rows[options.titleRow] ?? {}), hpt: 30 };
  for (const row of options.metadataRows) {
    rows[row] = { ...(rows[row] ?? {}), hpt: 20 };
  }
  rows[options.headerRow] = { ...(rows[options.headerRow] ?? {}), hpt: 34 };
  for (let row = options.firstDataRow; row <= lastDataRow; row += 1) {
    rows[row] = { ...(rows[row] ?? {}), hpt: 22 };
  }
  sheet["!rows"] = rows;
}
