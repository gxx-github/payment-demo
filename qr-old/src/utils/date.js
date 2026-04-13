import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

// 规范化字符串：
// - 同时包含偏移(+00:00)和 Z 时，去掉多余的 Z
// - 将超过 3 位的小数秒裁剪为 3 位
function normalizeIsoLikeString(str) {
    let s = str.trim();
    s = s.replace(/([+-])\d{2}:\d{2}Z$/i, (m) => m.slice(0, -1));
    s = s.replace(/(\.\d{3})\d+(?=([zZ]|[+-]\d{2}:\d{2}|$))/, '$1');
    return s;
}

function formatOutput(d) {
    // 目标格式：YYYY-MM-DD HH:mm:ss
    return d.format('YYYY-MM-DD HH:mm:ss');
}

// 支持的输入：
// - Date 对象
// - 字符串：
//   1) "YYYY-M-D HH:mm:ss"（例如 2025-11-4 14:56:04）
//   2) 类 ISO 字符串（可能含 +00:00Z 等非标准形式）
export function formatDateDisplay(dateInput) {
    try {
        if (!dateInput) {
            return formatOutput(dayjs());
        }

        if (dateInput instanceof Date) {
            const d = dayjs(dateInput);
            return d.isValid() ? formatOutput(d) : formatOutput(dayjs());
        }

        if (typeof dateInput === 'string') {
            const raw = dateInput.trim();

            // 情况 1：YYYY-M-D HH:mm:ss（严格解析）
            const dCustom = dayjs(raw, 'YYYY-M-D HH:mm:ss', true);
            if (dCustom.isValid()) return formatOutput(dCustom);

            // 情况 2：ISO-like，规范化后解析
            const normalized = normalizeIsoLikeString(raw);
            let d = dayjs(normalized);
            if (d.isValid()) return formatOutput(d);

            // 兜底：去掉小数秒再试
            const fallback = normalized.replace(/(\.\d+)(.*)$/, '$2');
            d = dayjs(fallback);
            return d.isValid() ? formatOutput(d) : formatOutput(dayjs());
        }

        // 其他类型，尝试直接构造
        const d = dayjs(dateInput);
        return d.isValid() ? formatOutput(d) : formatOutput(dayjs());
    } catch (_) {
        return formatOutput(dayjs());
    }
}

export default formatDateDisplay;