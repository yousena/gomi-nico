/* =====================================================
   カレンダー登録（v1.120）
   Cloudflare Pages Functions。サイトに初めて追加するサーバー機能。
   KV/D1等の保存領域は使わず、リクエストのたびに同一オリジンの
   /data_{city}.json（既存の静的アセット）を読み、その場で.icsを組み立てて返すだけの
   ステートレスな実装。カテゴリのラベル・出し方テキストはdata_{city}.jsonを
   単一の情報源として使うため、フロント側（script.js）とここで二重管理しない。

   最大のポイントは、v1.117で使っていた「Content-Disposition: attachment」
   （強制ダウンロード）を付けないこと。text/calendarのMIMEタイプだけを正しく返すことで、
   ファイルダウンロードという明示的な保存操作を経由させず、モバイルブラウザが
   OS標準のカレンダーアプリへその場で橋渡しすることを狙う
   （ホットペッパー等の予約サイトと同じ仕組み。DS.md 2-4-13節参照）。

   呼び出し例: /calendar-ics?city=toda&date=2026-08-15&types=moeru,pet
===================================================== */

/** icsのテキストフィールド用にHTMLタグを除去し、RFC5545の予約文字をエスケープする */
function icsEscape(html) {
  var text = String(html || '').replace(/<[^>]*>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function badRequest(message) {
  return new Response(message, { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

export async function onRequestGet(context) {
  var url = new URL(context.request.url);
  var city = url.searchParams.get('city') || '';
  var dateStr = url.searchParams.get('date') || '';
  var typesParam = url.searchParams.get('types') || '';

  // 入力検証（他ファイルへのパス操作・不正な値でのアクセスを防ぐ）
  if (!/^[a-z0-9_-]{1,40}$/.test(city)) return badRequest('invalid city');
  var dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateMatch) return badRequest('invalid date');
  var typeKeys = typesParam.split(',').map(function (s) { return s.trim(); })
    .filter(function (s) { return /^[a-z0-9_-]{1,30}$/.test(s); });
  typeKeys = typeKeys.filter(function (s, i) { return typeKeys.indexOf(s) === i; }).slice(0, 10); // 重複除去
  if (typeKeys.length === 0) return badRequest('invalid types');

  var year  = parseInt(dateMatch[1], 10);
  var month = parseInt(dateMatch[2], 10); // 1-12
  var day   = parseInt(dateMatch[3], 10);
  // 桁数だけでなく実在する日付かも検証する（例: 2026-99-99 のような桁数だけ合う値を弾く）。
  // UTCで組み立てた日付を分解し直し、入力値と完全一致するかで実在チェックする
  if (month < 1 || month > 12 || day < 1 || day > 31) return badRequest('invalid date');
  var checkDate = new Date(Date.UTC(year, month - 1, day));
  if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() !== month - 1 || checkDate.getUTCDate() !== day) {
    return badRequest('invalid date');
  }

  // data_{city}.jsonは同一オリジンの静的アセットなので、通常のfetchで取得できる。
  // 存在しないパスに対してHTTPステータス200のフォールバックページ（HTML）が返る
  // 環境があることを確認済みのため、ステータスだけでなくJSONとして読めるかも
  // 併せて検証し、読めない場合は「自治体が存在しない」扱いにする（500で落とさない）
  var dataUrl = new URL('/data_' + city + '.json', url.origin);
  var dataRes;
  try {
    dataRes = await fetch(dataUrl.toString());
  } catch (e) {
    return new Response('failed to fetch city data', { status: 502 });
  }
  if (!dataRes.ok) return new Response('city not found', { status: 404 });
  var data;
  try {
    data = await dataRes.json();
  } catch (e) {
    return new Response('city not found', { status: 404 });
  }
  if (!data || typeof data !== 'object' || !data.categories) {
    return new Response('city not found', { status: 404 });
  }

  var cats     = data.categories || {};
  var cityName = data.name || '';
  var mm = String(month).padStart(2, '0');
  var dd = String(day).padStart(2, '0');
  var dtStart = '' + year + mm + dd;
  var endDateObj = new Date(Date.UTC(year, month - 1, day + 1));
  var dtEnd = '' + endDateObj.getUTCFullYear() +
    String(endDateObj.getUTCMonth() + 1).padStart(2, '0') +
    String(endDateObj.getUTCDate()).padStart(2, '0');
  var dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//gomi-nico//JP', 'CALSCALE:GREGORIAN'];
  var foundAny = false;
  typeKeys.forEach(function (key) {
    var cat = cats[key];
    if (!cat) return; // data_{city}.jsonに存在しないカテゴリキーは無視
    foundAny = true;
    var uid = 'gomi-nico-' + dtStart + '-' + key + '-' + Math.random().toString(36).slice(2, 8) + '@gomi-nico.jp';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + dtStamp);
    lines.push('DTSTART;VALUE=DATE:' + dtStart);
    lines.push('DTEND;VALUE=DATE:' + dtEnd);
    lines.push('SUMMARY:' + icsEscape((cat.label || key) + (cityName ? '（' + cityName + '）' : '')));
    if (cat.how) lines.push('DESCRIPTION:' + icsEscape(cat.how));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');

  if (!foundAny) return badRequest('unknown category');

  return new Response(lines.join('\r\n'), {
    status: 200,
    headers: {
      // Content-Dispositionを付けないのが今回の要（ダウンロードさせない）
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
