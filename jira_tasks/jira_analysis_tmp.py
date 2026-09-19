import csv
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path


CSV_PATH = Path("/Users/fujinoshinyu/Downloads/Jira.csv")
OUTPUT_PATH = Path("/Users/fujinoshinyu/Documents/home-repo/_jira_analysis_dump.md")
GROUP_OUTPUT_PATH = Path("/Users/fujinoshinyu/Documents/home-repo/_jira_groups.md")


def normalize(summary: str) -> str:
    value = summary.strip()
    patterns = [
        r"^CLONE\s*-\s*",
        r"^【(?:追加)?修正】\s*",
        r"^【dev】\s*",
        r"^\[(?:V2|v2)\s*(?:FRONT|BACKEND)\]\s*",
        r"^(?:Legacy|現行)解析仕様書\s*[-：:]?\s*",
        r"^(?:wording mapping|Wording Mapping)\s*[-：:]?\s*",
        r"^(?:v2|V2)仕様書\s*(?:FRONT|BACKEND)?\s*[-：:]?\s*",
        r"^(?:FRONT|BACKEND)実装\s*[-：:]?\s*",
    ]
    changed = True
    while changed:
        changed = False
        for pattern in patterns:
            replaced = re.sub(pattern, "", value, flags=re.IGNORECASE)
            if replaced != value:
                value = replaced.strip()
                changed = True
    value = re.sub(r"\s+", " ", value)
    value = value.replace("＿", "_")
    return value


with CSV_PATH.open(encoding="utf-8-sig", newline="") as source:
    rows = list(csv.DictReader(source))

keys = [row["課題キー"].strip() for row in rows]
projects = Counter(key.split("-")[0] for key in keys)
types = Counter(row["課題タイプ"].strip() for row in rows)
priorities = Counter(row["優先度"].strip() or "（空欄）" for row in rows)
created_years = Counter(row["作成日"][:4] for row in rows)
completed_years = Counter(row["更新日"][:4] for row in rows)
assignees = Counter(row["担当者"].strip() for row in rows)
statuses = Counter(row["ステータス"].strip() for row in rows)
resolutions = Counter(row["解決状況"].strip() for row in rows)

normalized = defaultdict(list)
for row in rows:
    normalized[normalize(row["要約"])].append(row)

lines = [
    "# Jira CSV analysis dump",
    "",
    f"- records: {len(rows)}",
    f"- unique keys: {len(set(keys))}",
    f"- duplicate keys: {dict((key, count) for key, count in Counter(keys).items() if count > 1)}",
    f"- assignees: {dict(assignees)}",
    f"- projects: {dict(projects)}",
    f"- types: {dict(types)}",
    f"- priorities: {dict(priorities)}",
    f"- created years: {dict(sorted(created_years.items()))}",
    f"- updated years: {dict(sorted(completed_years.items()))}",
    f"- statuses: {dict(statuses)}",
    f"- resolutions: {dict(resolutions)}",
    "",
    "## Exact normalized groups",
    "",
]

for title, group in sorted(normalized.items(), key=lambda item: (-len(item[1]), item[0])):
    if len(group) > 1:
        lines.append(f"### {title} ({len(group)})")
        for row in group:
            lines.append(f"- {row['課題キー']} | {row['作成日'][:10]}–{row['更新日'][:10]} | {row['要約']}")
        lines.append("")

lines.extend(["## All rows", ""])
for row in rows:
    lines.append(
        f"- {row['課題キー']} | {row['課題タイプ']} | {row['優先度'] or '（空欄）'} | "
        f"{row['作成日'][:10]}–{row['更新日'][:10]} | {row['要約']}"
    )

OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"wrote {OUTPUT_PATH} with {len(rows)} records")


row_by_key = {row["課題キー"]: row for row in rows}
assigned: set[str] = set()
groups: list[dict[str, object]] = []


def add_group(name: str, group_rows: list[dict[str, str]], area: str, note: str = "") -> None:
    fresh = [row for row in group_rows if row["課題キー"] not in assigned]
    if not fresh:
        return
    groups.append({"name": name, "rows": fresh, "area": area, "note": note})
    assigned.update(row["課題キー"] for row in fresh)


def rows_for(*wanted_keys: str) -> list[dict[str, str]]:
    return [row_by_key[key] for key in wanted_keys if key in row_by_key]


def classify(title: str) -> str:
    checks = [
        ("admin-v2：メール送信", ["メール送信"]),
        ("admin-v2：提携状態管理", ["提携状態管理", "提携中", "未承認", "提携却下", "提携解除"]),
        ("admin-v2：クライアントサイト詳細", ["クライアントサイト詳細"]),
        ("admin-v2：掲載方法・集客経路", ["掲載方法", "集客経路"]),
        ("admin-v2：画面・業務機能移行", ["プロモーション予算設定"]),
        ("admin-v2：現行機能分析", ["機能分析", "現行admin", "提携状況確認"]),
        ("基盤・Repository共通化・CI/CD", ["repository", "drizzle", "CI/CD", "CICD", "パッケージ更新", "lint", "staging/admin-v2", "lambdaをデプロイ"]),
        ("Document API", ["document-api", "documentAPI", "DocumentAPI", "ドキュメントAPI"]),
        ("計測・成果・外部連携", ["計測", "成果", "ポストバック", "LINE", "Lambda", "Google", "Rakuten", "U-NEXT", "AppsFlyer", "Socket", "トラッキング", "API連携", "サンクスリンク"]),
        ("インフラ・セキュリティ", ["WAF", "脆弱性", "DNS", "Akamai", "セキュリティ", "依存性"]),
        ("レポート・請求・データ品質", ["レポート", "請求", "支払", "売上", "データ修正", "インボイス", "料率", "報酬", "ランク", "csv"]),
        ("画面・コンテンツ改善", ["画面", "表示", "ページ", "ボタン", "フォーム", "導線", "文言", "メール", "サイト追加"]),
        ("調査・分析", ["調査", "確認", "回答", "SPIKE", "洗い出", "質問"]),
    ]
    for area, words in checks:
        if any(word.lower() in title.lower() for word in words):
            return area
    return "個別運用・設定"


# admin-v2のメール種別は、エピック・解析・仕様・FE/BE実装・明示的追加修正を種別単位で統合する。
mail_rows = [row for row in rows if "/メール送信/" in row["要約"]]
mail_features: defaultdict[str, list[dict[str, str]]] = defaultdict(list)
for row in mail_rows:
    feature = row["要約"].split("/メール送信/", 1)[1]
    feature = re.split(r"\s{2,}(?:BACKEND|FRONT|v2仕様書|wording|Legacy)", feature, maxsplit=1)[0]
    feature = re.split(r"[_　](?:表記修正|成果対象名|半角スペース)", feature, maxsplit=1)[0]
    feature = re.sub(r"\s+表記修正$", "", feature)
    feature = feature.strip()
    if feature == "全画面":
        feature = "メール送信共通UI"
    mail_features[feature].append(row)
for feature, feature_rows in sorted(mail_features.items()):
    add_group(f"メール送信：{feature}", feature_rows, "admin-v2：メール送信")

# admin-v2の明示的な機能移行ライフサイクルを機能名単位で統合する。
lifecycle_markers = ("Legacy解析仕様書", "wording mapping", "v2仕様書", "FRONT 実装", "BACKEND 実装")
lifecycle_rows: defaultdict[str, list[dict[str, str]]] = defaultdict(list)
for row in rows:
    title = row["要約"].strip()
    if not title.startswith(("【dev】1_", "【legacy】1_")):
        continue
    if "/メール送信/" in title:
        continue
    canonical = re.sub(r"^【(?:dev|legacy)】", "", title).strip()
    canonical = re.sub(r"\s+(?:BACKEND|FRONT)\s+実装$", "", canonical)
    canonical = re.sub(r"\s+v2仕様書\s+(?:BACKEND|FRONT)$", "", canonical)
    canonical = re.sub(r"\s+(?:wording mapping|Legacy解析仕様書)$", "", canonical)
    lifecycle_rows[canonical.strip()].append(row)

epic_aliases = {
    "1_クライアント/クライアントサイト詳細_確認": "1_クライアント/クライアントサイト詳細_編集_確認",
}
for canonical, feature_rows in sorted(lifecycle_rows.items()):
    epic_name = epic_aliases.get(canonical, canonical)
    epic_rows = [row for row in rows if row["課題タイプ"] == "エピック" and row["要約"].strip() == epic_name]
    if canonical == "1_クライアント/プロモーション予算設定":
        feature_rows += rows_for("AFBSYS-1803", "AFBSYS-13211")
    add_group(canonical, epic_rows + feature_rows, classify(canonical))

# 明らかな追加修正・不足工程を既存の機能成果へまとめる。
manual_groups = [
    ("プロモーション予算設定", ("AFBSYS-1803", "AFBSYS-11229", "AFBSYS-13211"), "admin-v2：画面・業務機能移行"),
    ("掲載方法・集客経路確認：詳細の追加修正", ("AFBSYS-13177", "AFBSYS-13175"), "admin-v2：掲載方法・集客経路"),
    ("提携状態管理：未承認確認と追加修正", ("AFBSYS-12504", "AFBSYS-13180"), "admin-v2：提携状態管理"),
    ("提携状態管理：検索導線修正", ("AFBSYS-12370", "AFBSYS-12367"), "admin-v2：提携状態管理"),
    ("提携状態管理：CSVダウンロード追加修正", ("AFBSYS-12052", "AFBSYS-12860"), "admin-v2：提携状態管理"),
    ("提携状態管理：提携中データ・確認画面修正", ("AFBSYS-12837", "AFBSYS-13045"), "admin-v2：提携状態管理"),
    ("クライアントサイト詳細：UI追加修正", ("AFBSYS-12559", "AFBSYS-12558", "AFBSYS-12556"), "admin-v2：クライアントサイト詳細"),
    ("admin-v2 FE/BE実装修正（対象不明）", ("AFBSYS-7804", "AFBSYS-7803", "AFBSYS-7801", "AFBSYS-7800"), "admin-v2：画面・業務機能移行"),
    ("Repository共通化（16 Repository＋Drizzle共通処理）", ("AFBSYS-7929", "AFBSYS-7773", "AFBSYS-7772", "AFBSYS-7770", "AFBSYS-7769", "AFBSYS-7768", "AFBSYS-7767", "AFBSYS-7766", "AFBSYS-7763", "AFBSYS-7762", "AFBSYS-7761", "AFBSYS-7760", "AFBSYS-7759", "AFBSYS-7758", "AFBSYS-7757", "AFBSYS-7756", "AFBSYS-7747"), "基盤・Repository共通化・CI/CD"),
    ("backend-common CI/CD・テスト・自動公開", ("AFBSYS-7588", "AFBSYS-7097", "AFBSYS-7053"), "基盤・Repository共通化・CI/CD"),
    ("admin-v2現行機能分析（22画面）", tuple(["AFBOPS-901", "AFBOPS-817", "AFBOPS-807", "AFBOPS-792", "AFBOPS-760"] + [f"AFBOPS-{number}" for number in range(819, 841) if f"AFBOPS-{number}" in row_by_key]), "admin-v2：現行機能分析"),
    ("Document API：Node.js 22/24対応", ("FOR-89", "AFBOPS-1017"), "Document API"),
    ("Document API：Lambda・Layer・Authorizer・API Gateway", ("AFBOPS-989", "AFBOPS-988", "AFBOPS-987"), "Document API"),
    ("Document API：脆弱性対策とacross切替", ("AFBOPS-1167", "AFBSYS-911", "AFBSYS-5505", "AFBSYS-5056"), "Document API"),
    ("LINE計測：Core Clinic", ("AFBOPS-1185", "AFBSYS-921"), "計測・成果・外部連携"),
    ("Rakuten Play×U-NEXT：連携ファイル不備対応", ("AFBOPS-1051", "AFBSYS-941"), "計測・成果・外部連携"),
    ("モグワン：成果報酬金額の調査・対応", ("AFBOPS-872", "AFBOPS-905", "AFBOPS-958"), "計測・成果・外部連携"),
    ("エアクロモール：Socket案件のタグ成果調査", ("AFBOPS-867", "AFBOPS-906"), "計測・成果・外部連携"),
    ("DTフラグ予約の確認", ("AFBOPS-864", "AFBOPS-904"), "調査・分析"),
    ("TEMU：未反映CVの調査・反映", ("AFBOPS-848", "AFBOPS-908"), "計測・成果・外部連携"),
    ("paters club：男女別URL調査", ("AFBOPS-843", "AFBOPS-907"), "調査・分析"),
    ("DNS計測×Shopifyカート：XENOVA", ("AFBOPS-1112", "AFBSYS-939"), "計測・成果・外部連携"),
    ("ホットヨガloIve：トラッキング漏れ再確認", ("AFBOPS-593", "AFBOPS-656"), "計測・成果・外部連携"),
    ("Shopifyカート計測不備の調査・一次回答", ("AFBOPS-587", "AFBOPS-619"), "計測・成果・外部連携"),
    ("Bizテストコード発行画面修正・リリース", ("AFBOPS-603", "AFBOPS-635"), "画面・コンテンツ改善"),
    ("古い特集ページの導線・ファイル削除", ("AFBOPS-1081", "AFBOPS-1095"), "画面・コンテンツ改善"),
    ("SPIKE事前調査", ("AFBSYS-13182", "AFBSYS-13332", "AFBSYS-13458"), "調査・分析"),
]
for name, wanted_keys, area in manual_groups:
    add_group(name, rows_for(*wanted_keys), area)

# 残りはCSVだけで親子関係を断定せず、一件一成果として保持する。
for row in rows:
    if row["課題キー"] not in assigned:
        add_group(row["要約"].strip(), [row], classify(row["要約"]))


def consolidate(name: str, source_names: tuple[str, ...], area: str) -> None:
    matched = [group for group in groups if str(group["name"]) in source_names]
    if len(matched) < 2:
        return
    merged_rows = [row for group in matched for row in group["rows"]]
    groups[:] = [group for group in groups if group not in matched]
    groups.append({"name": name, "rows": merged_rows, "area": area, "note": ""})


consolidations = [
    ("クライアントサイト詳細（表示・編集・確認・UI追補）", ("1_クライアント/クライアントサイト詳細_確認", "1_クライアント/クライアントサイト詳細_編集", "1_クライアント/クライアントサイト詳細_表示", "クライアントサイト詳細：UI追加修正"), "admin-v2：クライアントサイト詳細"),
    ("掲載方法・集客経路確認：詳細", ("1_クライアント/掲載方法・集客経路確認_詳細", "掲載方法・集客経路確認：詳細の追加修正"), "admin-v2：掲載方法・集客経路"),
    ("提携状態管理：提携中・確認・追補修正", ("1_クライアント/提携状態管理 [提携中]", "1_クライアント/提携状態管理 [提携中]_確認", "提携状態管理：提携中データ・確認画面修正"), "admin-v2：提携状態管理"),
    ("提携状態管理：未承認・確認・追補修正", ("1_クライアント/提携状態管理 [未承認]", "1_クライアント/提携状態管理 [未承認]_確認", "提携状態管理：未承認確認と追加修正"), "admin-v2：提携状態管理"),
    ("提携状態管理：検索・導線・結果修正", ("1_クライアント/提携状態管理_検索", "1_クライアント/提携状態管理＿検索結果を正常値にする", "提携状態管理：検索導線修正"), "admin-v2：提携状態管理"),
    ("提携状態管理：CSVダウンロード", ("1_クライアント/提携状態管理_csvDL", "1_クライアント/提携状態管理_パートナーデータCSVDL", "CLONE - 【dev】1_クライアント/提携状態管理 [CSVDL merge]  BACKEND 実装", "CLONE - 【dev】1_クライアント/提携状態管理 [CSVDL merge]  FRONT 実装", "提携状態管理：CSVダウンロード追加修正"), "admin-v2：提携状態管理"),
    ("admin-v2・gatewayパッケージ更新（3サービス）", ("admin-v2 バックエンドのパッケージ更新", "admin-v2フロントエンドのパッケージ更新", "afb-gatewayのパッケージ更新"), "基盤・Repository共通化・CI/CD"),
    ("admin-v2三項演算子ネスト禁止ルール導入・適用", ("【admin-v2】lintルール/AI実装ルールの追加：三項演算子の入れ子禁止", "【admin-v2】lintルール：三項演算子の入れ子撤去 error適応"), "基盤・Repository共通化・CI/CD"),
    ("afb-top AWS WAF設定・ブロック設定", ("CLONE - afb-top（https://www.afi-b.com/）へのAWS WAFのblock設定", "CLONE - afb-top（https://www.afi-b.com/）へのAWS WAFの設定依頼"), "インフラ・セキュリティ"),
    ("資料ダウンロードフォーム修正（local/dev）", ("CLONE dev 資料ダウンロードフォームを修正する", "CLONE local 資料ダウンロードフォームを修正する"), "画面・コンテンツ改善"),
    ("電話通信履歴ページ修正", ("電話通信履歴ページ修正依頼", "電話通信履歴ページ表示修正依頼"), "画面・コンテンツ改善"),
    ("LP削除・リダイレクト追加対応", ("LPの削除/リダイレクト設定依頼", "LP削除 追加2点"), "個別運用・設定"),
]
for consolidated_name, source_names, consolidated_area in consolidations:
    consolidate(consolidated_name, source_names, consolidated_area)

area_order = [
    "admin-v2：メール送信", "admin-v2：提携状態管理", "admin-v2：クライアントサイト詳細",
    "admin-v2：掲載方法・集客経路", "admin-v2：現行機能分析", "admin-v2：画面・業務機能移行",
    "基盤・Repository共通化・CI/CD", "Document API", "計測・成果・外部連携",
    "インフラ・セキュリティ", "レポート・請求・データ品質", "画面・コンテンツ改善",
    "調査・分析", "個別運用・設定",
]
groups.sort(key=lambda group: (area_order.index(str(group["area"])), str(group["name"])))

group_lines = [f"# Groups ({len(groups)})", ""]
for area in area_order:
    area_groups = [group for group in groups if group["area"] == area]
    if not area_groups:
        continue
    group_lines.extend([f"## {area} ({len(area_groups)}成果)", ""])
    for group in area_groups:
        group_rows = group["rows"]
        dates = [datetime.strptime(row["更新日"][:10], "%Y/%m/%d") for row in group_rows]
        created = [datetime.strptime(row["作成日"][:10], "%Y/%m/%d") for row in group_rows]
        keys_text = ", ".join(row["課題キー"] for row in group_rows)
        group_lines.append(
            f"- {group['name']} | {len(group_rows)} | {keys_text} | "
            f"{min(created).date().isoformat()}〜{max(dates).date().isoformat()}"
        )
    group_lines.append("")

flat_group_keys = [row["課題キー"] for group in groups for row in group["rows"]]
group_lines.extend([
    "## Verification",
    f"- grouped keys: {len(flat_group_keys)}",
    f"- unique grouped keys: {len(set(flat_group_keys))}",
    f"- missing: {sorted(set(keys) - set(flat_group_keys))}",
    f"- unknown: {sorted(set(flat_group_keys) - set(keys))}",
    f"- duplicate: {dict((key, count) for key, count in Counter(flat_group_keys).items() if count > 1)}",
])
GROUP_OUTPUT_PATH.write_text("\n".join(group_lines) + "\n", encoding="utf-8")
print(f"wrote {GROUP_OUTPUT_PATH} with {len(groups)} groups")

report_path = Path("/Users/fujinoshinyu/Documents/home-repo/JIRA_COMPLETED_WORK_ANALYSIS.md")
if report_path.exists():
    report_text = report_path.read_text(encoding="utf-8")
    report_keys = re.findall(r"\b(?:AFBSYS|AFBOPS|FOR)-\d+\b", report_text)
    missing = sorted(set(keys) - set(report_keys))
    unknown = sorted(set(report_keys) - set(keys))
    duplicates = {key: count for key, count in Counter(report_keys).items() if count > 1}
    print(f"report key occurrences: {len(report_keys)}")
    print(f"report unique keys: {len(set(report_keys))}")
    print(f"missing: {missing}")
    print(f"unknown: {unknown}")
    print(f"duplicates: {duplicates}")