# ストア文言の点検（iOS 事務用 1.2・選手用 1.3／英・仏・葡）

点検日 2026-10-08 ／ 対象 `native/store-assets/store-localization.json` と同 `.md`（コミット b1acf23）
ストア文言そのものは直していない。提出もしていない。

## まとめ

- **文字数：全 30 項目が合格。** 上限を超えるものはない。キーワードは仏・葡のアクセント文字（é・î・ô・ç・á・ó）が UTF-8 で 2 バイトになるため、文字数とバイト数を両方載せた。いちばん多いのは 93 バイトで、上限は 100。
- **アプリ名・機能名・数字：大きな食い違いはない。** 選手用の説明に出てくる事務用アプリの名前は、3 言語ともその言語の事務用アプリ名と一致している。無料プランの上限（思い出 10・人数 5）とデザイン数（8・8・9）も 3 言語で同じ。
- **バージョン番号：文言の中に出てこないので、食い違いはない。** ただし、1.2・1.3 の「このバージョンの新機能（What's New）」の文言がどの言語にもない（下の指摘 V-1）。
- **直したほうがよいもの**：en-US なのにイギリス式のつづりになっている（S-1）。「Apple ID」が古い呼び方のまま（S-2）。キーワードがアプリ名・サブタイトルと重なってバイトを無駄にしている（K-1）。

## 1. 文字数の点検

数え方：名前・サブタイトル・プロモーション・説明は文字数、キーワードは UTF-8 のバイト数（カッコ内は文字数）で数えた。
名前・サブタイトル・キーワード・プロモーションは、この点検で 1 文字ずつ数え直した。説明は `.md` の見出しにある記載値を使った（いちばん長い 2744 文字でも上限まで 1200 文字以上余るので、多少ずれても合否は変わらない）。
`.json` と `.md` の本文は、30 項目とも同じ内容だった（目で見て照合）。

### 事務用（My柔道(事務)・1.2）

| 言語 | 項目 | 数 | 上限 | 合否 | 表記ゆれの指摘 |
|---|---|---|---|---|---|
| en-US | 名前 | 21 | 30 | ✅ | なし |
| en-US | サブタイトル | 21 | 30 | ✅ | N-3（3 つ目の項目が言語によって違う） |
| en-US | キーワード | 89 バイト（89 文字） | 100 バイト | ✅ | K-1（judo・dojo が名前と重なる） |
| en-US | プロモーション | 82 | 170 | ✅ | なし |
| en-US | 説明 | 2451 | 4000 | ✅ | S-1（cancelled）・S-2（Apple ID） |
| fr-FR | 名前 | 22 | 30 | ✅ | N-1（「Gestion Dojo」に de がない） |
| fr-FR | サブタイトル | 28 | 30 | ✅ | N-3（「suivi」で、試合の要素がない） |
| fr-FR | キーワード | 93 バイト（89 文字） | 100 バイト | ✅ | K-1（judo・dojo・cotisation が名前・サブタイトルと重なる） |
| fr-FR | プロモーション | 91 | 170 | ✅ | なし |
| fr-FR | 説明 | 2744 | 4000 | ✅ | S-2（Identifiant Apple）・T-1（touche／appui） |
| pt-BR | 名前 | 23 | 30 | ✅ | なし |
| pt-BR | サブタイトル | 27 | 30 | ✅ | N-3 |
| pt-BR | キーワード | 87 バイト（85 文字） | 100 バイト | ✅ | K-1（dojo・mensalidade が名前・サブタイトルと重なる） |
| pt-BR | プロモーション | 76 | 170 | ✅ | なし |
| pt-BR | 説明 | 2533 | 4000 | ✅ | S-2（ID Apple） |

### 選手用（My柔道(選手)・1.3）

| 言語 | 項目 | 数 | 上限 | 合否 | 表記ゆれの指摘 |
|---|---|---|---|---|---|
| en-US | 名前 | 15 | 30 | ✅ | N-2（事務用と違い、どの言語も英語の名前のまま） |
| en-US | サブタイトル | 24 | 30 | ✅ | なし |
| en-US | キーワード | 89 バイト（89 文字） | 100 バイト | ✅ | K-1（judo・match・record が名前・サブタイトルと重なる） |
| en-US | プロモーション | 81 | 170 | ✅ | なし |
| en-US | 説明 | 2144 | 4000 | ✅ | S-1（colours・colour・cancelled・towards）・S-2・F-1（memories／Memories）・F-2（main people） |
| fr-FR | 名前 | 15 | 30 | ✅ | N-2 |
| fr-FR | サブタイトル | 24 | 30 | ✅ | N-4（「思い出」の要素がない） |
| fr-FR | キーワード | 93 バイト（91 文字） | 100 バイト | ✅ | K-1（judo・combat・entraînement が名前・サブタイトルと重なる） |
| fr-FR | プロモーション | 83 | 170 | ✅ | なし |
| fr-FR | 説明 | 2545 | 4000 | ✅ | S-2・T-1 |
| pt-BR | 名前 | 15 | 30 | ✅ | N-2 |
| pt-BR | サブタイトル | 25 | 30 | ✅ | なし |
| pt-BR | キーワード | 87 バイト（84 文字） | 100 バイト | ✅ | K-1（judô・luta・treino・memória が名前・サブタイトルと重なる） |
| pt-BR | プロモーション | 77 | 170 | ✅ | なし |
| pt-BR | 説明 | 2362 | 4000 | ✅ | S-2 |

## 2. 指摘の一覧

重さ：🔴 提出前に直すべき ／ 🟡 直したほうがよい ／ ⚪ 好みの問題・参考

| 番号 | 重さ | 対象 | 内容 | 直し方の案（文章のみ。ファイルは直していない） |
|---|---|---|---|---|
| V-1 | 🟡 | 両アプリ・全言語 | 1.2・1.3 の「このバージョンの新機能（What's New）」の文言がない。アップデートの審査に出すときに、言語ごとに入力が求められる | v273〜v275 の内容（タブの帯・申込管理の保存と破棄／日別シートの場所とメモ・出場者名の共有と表示）で 3 言語×2 アプリぶんを用意する |
| S-1 | 🟡 | en-US（両アプリ） | アメリカ向けなのにイギリス式のつづり。事務用：cancelled ×2。選手用：colours・colour・cancelled ×2・towards | canceled・colors・color・toward に統一する |
| S-2 | 🟡 | 全言語の説明（料金の段落） | 解約の手順が「Settings › Apple ID › Subscriptions」になっている（仏 Identifiant Apple、葡 ID Apple）。今の iOS では「Apple ID」が「Apple Account（仏 Compte Apple、葡 Conta Apple）」に変わり、設定画面の一番上は自分の名前になっている | 「Settings › [your name] › Subscriptions」のように、名前の部分を言語ごとに書き換える |
| K-1 | 🟡 | 全キーワード | App Store はアプリ名とサブタイトルも検索に使うので、キーワード欄で同じ語を繰り返すとバイトの無駄になる。重なっている語：事務用 en judo・dojo／fr judo・dojo・cotisation／pt dojo・mensalidade（judô は表記が違うので別の語として扱われる可能性あり）。選手用 en judo・match・record／fr judo・combat・entraînement／pt judô・luta・treino・memória | 重なっている語を外し、空いたバイトに別の検索語を入れる（例：事務用 en に roster・dues・schedule など） |
| N-1 | ⚪ | 事務用 fr の名前 | 「Gestion Dojo」は前置詞がない。葡は「Gestão de Dojo」と de を入れている | 自然なフランス語にするなら「My Judo : Gestion de dojo」（25 文字で上限内）。いまの形でもブランド名として通じる |
| N-2 | ⚪ | 両アプリの名前の方針 | 事務用は仏・葡で名前を訳している（Gestion Dojo／Gestão de Dojo）が、選手用はどの言語も英語の「My Judo History」のまま。間違いではないが、方針がそろっていない | 選手用も訳すか（例：仏 My Judo : Carnet、葡 My Judo: Histórico）、両方とも英語の名前にそろえるかを決める |
| N-3 | ⚪ | 事務用のサブタイトル | 3 つ目の項目が言語によって違う。en matches（試合）・葡 lutas（試合）に対して、仏は suivi（記録・管理）で試合の要素がない | 仏を「Effectif, cotisations, combats」（30 文字で、上限ちょうど）にすると、ほかの言語とそろう |
| N-4 | ⚪ | 選手用 fr のサブタイトル | en「Match records & memories」・葡「Lutas, treinos e memórias」には思い出（memories）があるが、仏「Combats et entraînements」にはない | 「Combats, souvenirs, séances」など、30 文字以内で思い出を入れる |
| F-1 | ⚪ | 選手用 en の説明 | 機能名の Memories が、場所によって大文字と小文字になっている（見出し MEMORIES・本文 basics of Memories に対して、Pro の箇条書きは Unlimited memories） | 機能名として扱うなら Unlimited Memories にそろえる |
| F-2 | ⚪ | 選手用 en の説明 | 「Unlimited main people」は意味がわかりにくい。仏「judokas suivis（記録する選手）」、葡「atletas（選手）」と比べて言い方がぶれている | 「Unlimited athletes tracked」など、仏・葡に合わせた言い方にする |
| T-1 | ⚪ | fr（両アプリ） | 「タップ」を、appui（un appui・quelques appuis）と touche（Une seule touche exporte…）の 2 通りで訳している | 「Un seul appui exporte…」のように appui にそろえる |

### 点検して問題がなかったもの

- 選手用の説明に出てくる事務用アプリの名前：en My Judo: Dojo Manager／fr My Judo : Gestion Dojo／pt My Judo: Gestão de Dojo。3 言語とも、その言語の事務用アプリ名と一致している。
- コロンの前の空き（仏だけ「My Judo :」）：フランス語の書き方の決まりどおりなので、問題ない。
- 数字：無料プランの思い出 10・人数 5、デザインの 8 色・8 レイアウト・9 柄、自動更新の 24 時間前。3 言語で同じ。
- 機能名：kumi-kata（仏）・pegada（葡）・grip（英）、QR code、iCloud Drive、Kodokan、Pro。それぞれの言語の中で表記がそろっている。
- URL（利用規約・プライバシーポリシー・サポート）：6 つの説明で同じ。
- バージョン番号：ストア文言の中に出てこないので、食い違いはない（バージョンは各 `project.pbxproj` の中にあり、事務用 1.2・選手用 1.3）。
