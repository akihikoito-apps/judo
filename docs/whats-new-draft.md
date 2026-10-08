# What's New の下書き（iOS 事務用 1.2・選手用 1.3／英・仏・葡）

作成日 2026-10-08 ／ docs/store-text-check.md の指摘 V-1 に対応する下書き。
**下書きのみ。** `native/store-assets/store-localization.json`・`.md` には入れていない。App Store Connect への入力・提出もしていない。

## もとにした変更（git 履歴より）

CHANGELOG ファイルはリポジトリにないため、コミット 9cadfaa（バージョンを上げたコミット）と、そこに挙がっている v273〜v275 のコミット本文から書いた。

| 版 | コミット | 事務用 1.2 | 選手用 1.3 |
|---|---|---|---|
| v273 | 293750a | 指でつまんで拡大したとき、下のタブの帯が画面の途中に浮くのを直した | 同じ |
| v274 | b990b1e | 申込管理に「✅ 保存してとじる」「破棄してとじる」を並べた（破棄は確認を出し、開いたときの状態に戻す） | 日別シートに予定の場所とメモを出す（事務用にはもともと出ていた） |
| v275 | 896c5bf | 予定を送るとき、申込管理で登録した出場者の名前だけを一緒に送る（参加費・集金・個人メモは送らない。入りきらないぶんは「ほかN人」） | 日別シートに出場者を出し、自分や家族の名前を太字にする |

## 書き方の決まり

- アプリ名・バージョン番号は docs/store-text-check.md と同じ表記にした（事務用 en「My Judo: Dojo Manager」／fr「My Judo : Gestion Dojo」／pt「My Judo: Gestão de Dojo」、選手用は 3 言語とも「My Judo History」。事務用 1.2・選手用 1.3）。
- ボタン名・機能名は、アプリの中の訳（index.html の辞書）に合わせた。
  - 申込管理：en Entry admin／fr Gestion inscriptions／pt Gestão de inscrições
  - ✅ 保存してとじる：en Save and close／fr Enregistrer et fermer／pt Salvar e fechar
  - 破棄してとじる：en Discard and close／fr Abandonner et fermer／pt Descartar e fechar
  - ほかN人：en and N more／fr et N autres／pt e mais N
- en はアメリカ式のつづり（指摘 S-1 と同じ失敗をしない）。「Apple ID」は使っていない（指摘 S-2 に関係しない）。
- タップは fr で appui にそろえた（指摘 T-1 と同じ失敗をしない）。
- 大げさな言い方はしない。直したこと・増えたことだけを書く。
- 事務用の v275 は「相手の選手用アプリも 1.3 にしないと名前は表示されない」ため、その旨を一言入れた（古いアプリは新しい欄を無視するだけで壊れない＝コミット 896c5bf）。

## 文字数（上限 4000）

本文（下の各コードブロックの中身）の文字数。文ごとに手で数えた概算（作業環境で文字数を数えるコマンドが使えなかったため）。いちばん長い事務用 fr でも 900 文字前後で、上限まで 3000 文字以上余るので、多少ずれても合否は変わらない。

| アプリ | 言語 | 文字数（概算） | 上限 | 合否 |
|---|---|---|---|---|
| 事務用 1.2 | en-US | 約 760 | 4000 | ✅ |
| 事務用 1.2 | fr-FR | 約 880 | 4000 | ✅ |
| 事務用 1.2 | pt-BR | 約 780 | 4000 | ✅ |
| 選手用 1.3 | en-US | 約 430 | 4000 | ✅ |
| 選手用 1.3 | fr-FR | 約 460 | 4000 | ✅ |
| 選手用 1.3 | pt-BR | 約 430 | 4000 | ✅ |

---

## 事務用（My Judo: Dojo Manager・1.2）

### en-US

```text
What's new in version 1.2

• Entry admin now has "Save and close" and "Discard and close" buttons. Discard asks first, then puts the entry back the way it was when you opened it. As before, each field is saved once you finish entering it.
• When you share the schedule, the names of the athletes entered for each tournament go with it, so each athlete can see whether they are competing. Only names are sent: fees, payment status and private notes stay on your device. If the list is too long for the QR code, it ends with "and N more". Athletes need My Judo History 1.3 to see the names; older versions simply ignore them.
• Fixed: after zooming in with two fingers, the tab bar could float in the middle of the screen.
```

### fr-FR

```text
Nouveautés de la version 1.2

• Gestion inscriptions propose maintenant deux boutons : « Enregistrer et fermer » et « Abandonner et fermer ». Abandonner demande une confirmation, puis remet l’inscription dans l’état où elle était à l’ouverture. Comme avant, chaque champ est enregistré dès que vous validez la saisie.
• Quand vous partagez le planning, les noms des judokas inscrits à chaque compétition sont joints, pour que chacun sache s’il combat. Seuls les noms sont envoyés : tarifs, encaissements et notes personnelles restent sur votre appareil. Si la liste est trop longue pour le QR code, elle se termine par « et N autres ». Les judokas ont besoin de My Judo History 1.3 pour voir les noms ; les versions plus anciennes les ignorent simplement.
• Correction : après un zoom à deux doigts, la barre d’onglets pouvait flotter au milieu de l’écran.
```

### pt-BR

```text
Novidades da versão 1.2

• A Gestão de inscrições agora tem os botões "Salvar e fechar" e "Descartar e fechar". Descartar pede confirmação e volta a inscrição para como estava quando você abriu. Como antes, cada campo é salvo assim que você termina de preenchê-lo.
• Ao compartilhar a agenda, os nomes dos atletas inscritos em cada campeonato vão junto, para cada um saber se vai lutar. Só os nomes são enviados: valores, situação de pagamento e anotações pessoais ficam no seu aparelho. Se a lista não couber no QR code, ela termina com "e mais N". Os atletas precisam do My Judo History 1.3 para ver os nomes; as versões anteriores simplesmente os ignoram.
• Corrigido: depois de ampliar com dois dedos, a barra de abas podia ficar flutuando no meio da tela.
```

---

## 選手用（My Judo History・1.3）

### en-US

```text
What's new in version 1.3

• Tap a day in your calendar to see the location and notes for each event, right where you need them.
• Tournaments now show who is competing, when your dojo sends the schedule from My Judo: Dojo Manager 1.2. Your own name and your family's names are shown in bold so you can spot them at a glance.
• Fixed: after zooming in with two fingers, the tab bar could float in the middle of the screen.
```

### fr-FR

```text
Nouveautés de la version 1.3

• D’un appui sur un jour du calendrier, voyez le lieu et la note de chaque événement, là où vous en avez besoin.
• Les compétitions affichent maintenant les judokas qui combattent, quand votre club envoie le planning depuis My Judo : Gestion Dojo 1.2. Votre nom et ceux de votre famille sont en gras pour les repérer d’un coup d’œil.
• Correction : après un zoom à deux doigts, la barre d’onglets pouvait flotter au milieu de l’écran.
```

### pt-BR

```text
Novidades da versão 1.3

• Toque em um dia do calendário para ver o local e a anotação de cada evento, bem onde você precisa.
• Os campeonatos agora mostram quem vai lutar, quando o seu dojo envia a agenda pelo My Judo: Gestão de Dojo 1.2. O seu nome e os da sua família aparecem em negrito, para achar de relance.
• Corrigido: depois de ampliar com dois dedos, a barra de abas podia ficar flutuando no meio da tela.
```

---

## オーナーに決めてほしいこと（文章での提案のみ）

- 1 行目の見出し（「What's new in version 1.2」など）は、App Store がバージョン番号を別に表示するので、なくてもよい。短くしたいなら消してかまわない。
- 事務用の「選手側は 1.3 が必要」の一文と、選手用の「事務用 1.2 から送られた予定のとき」の一文は、同時に公開する場合も残す（選手が古いアプリのままだったり、道場側が古い事務用のままだったりすることがあるため）。レビューの指摘で「同時公開なら消してよい」という提案は取り下げた。

## 修正の記録

- 2026-10-08 レビューの指摘 2 件に対応。
  - ① 事務用の「入力中も保存され、突然終了しても失われない」という言い方は、実際の保存が入力を確定したとき（onchange）なので言い過ぎ。3 言語とも「入力を確定すると保存される」という意味の文に直した（en「each field is saved once you finish entering it」／fr「chaque champ est enregistré dès que vous validez la saisie」／pt「cada campo é salvo assim que você termina de preenchê-lo」）。文字数は少し減っただけで合否は変わらない。
  - ② 必要バージョンの説明は消さずに残す（上の「決めてほしいこと」を書き直した）。
