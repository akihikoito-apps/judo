# What's New の下書き（iOS 事務用 1.3・選手用 1.4／日・英・仏・葡）

作成日 2026-11-20。**下書きです。** App Store Connect への入力・提出はまだしていません。

## もとにした変更

前回リリースのコミット `9cadfaa`（事務用 1.2・選手用 1.3 を出した版）から `HEAD` までの **107 コミット・31 版**（v276〜v324）。
CHANGELOG ファイルはないので、版ごとのコミット本文と `docs/app-audit-20261008.md`（10/8 の総点検）から書いた。

## 書き方の決まり（前回 docs/whats-new-draft.md と同じ）

- アプリ名の表記は `docs/store-text-check.md` に合わせる。
  事務用 en「My Judo: Dojo Manager」／fr「My Judo : Gestion Dojo」／pt「My Judo: Gestão de Dojo」。選手用は 3 言語とも「My Judo History」。
- 機能名・ボタン名は、アプリの中の訳（`index.html` の辞書）に合わせる。
- 大げさな言い方はしない。直したこと・増えたことだけを書く。
- en はアメリカ式のつづり。fr の「タップ」は appui にそろえる。
- 上限 4000 文字。いちばん長いもので 1200 文字前後なので、十分収まる。

## 入力前に必ず確かめること

- **LINEのカードは、選手用 1.3 以前でも開ける。**カードのボタンは予定表のリンクを開くだけなので、受け取る側のアプリの版は問わない。だから「相手も更新が必要」とは書いていない。
- **【未確認】合言葉つきの予定表を、選手用 1.3（現在ストアに出ている版）で開けるかどうか。**暗号化は v299〜v300 ＝ 1.3 を出したあとに入れたもの。
  リンクを開くと復号は表示ページ側で行われるので 1.3 でも通るはずだが、**実機で確かめていない。**
  確かめるまで「相手の更新が必要」とも「不要」とも書かない。本文にもその話は入れていない。
- **選手用の「日別シートに場所・メモ・出場者を出す」は、すでに選手用 1.3 で出している**（v274・v275）。
  今回の新機能に入れないこと。下書きでいったん入れてしまい、`9cadfaa` のコミット本文を読み直して取り消した。

---

# 事務用 1.3（My柔道(事務)）

## ja（日本語）

```
■ 予定表をLINEのカードで送れるようになりました
・長いリンクがトーク画面に出ません。受け取った方は、カードの「予定を見る」を押すだけです。
・送り方の画面を作り直しました。LINE／リンク／文字／QRコードの4つから選べます。

■ 予定表に合言葉をかけられます
・合言葉を決めると、予定の中身が暗号化されます。合言葉を知らない人はリンクを開いても読めません。
・合言葉を決めずに送ろうとしたときは、一度お止めして確認します。
・リンクの長さを、これまでの約半分にしました。

■ 予定を1日だけ直して送れます
・月をまるごと送り直さなくても、変わった日の分だけ送れます。

■ 直したところ
・学年の自動計算が1年ずれていたのを直しました。保存済みの学年も直しますが、自動で付けたものだけです（手で直した学年はそのままです）。
・試合結果の取り込みで、名字だけの一致などで別の方に結び付くことがありました。必ず確認してから選べるようにしました。
・団体戦で人数を変えると、並びがずれたり結果が消えたりすることがありました。
・試合報告で、何も入力していないのに「勝ち」が記録されることがありました。
・パスコードロックが、まれにかからないことがありました。戻ってきたときにもかかるようにしました。
・データが読めなかったとき、空のまま入力して消えてしまうおそれがありました。帯でお知らせし、退避データを書き出せるようにしました。
・写真やファイルの共有が、黙って失敗することがありました。
・横向きのロック画面、キーボードで隠れる保存ボタンなど、画面の崩れを直しました。
・カレンダーの月を「2026年 11月」の形にしました。大会までの日数も大きく出します。
・ご利用料金の説明を、実際の内容に合わせて書き直しました。
・端末のおまかせバックアップの扱いについて、ヘルプに明記しました。
```

## en-US

```
Send your schedule to LINE as a card
- No more long link filling up the chat. Recipients just tap "See schedule" on the card.
- The sharing screen has been rebuilt: choose LINE, Link, Text or QR code.

Protect a schedule with a passphrase
- Set a passphrase and the schedule is encrypted. Anyone without it cannot read the link.
- If you try to share without one, we stop and ask first.
- Links are now about half as long as before.

Fix a single day
- Changed one day? Send just that day instead of resending the whole month.

Fixes
- School year was calculated one year early. Saved years are corrected too, but only those set automatically — years you edited by hand are left alone.
- Importing match results could attach a result to the wrong person when only the family name matched. You are now always asked to confirm.
- Changing the roster size in a team match could shift the order or lose results.
- A match report could record a win with nothing entered.
- The passcode lock could occasionally fail to engage. It now also locks when you return to the app.
- If saved data could not be read, you could type into an empty app and lose it. A banner now stays up and you can export the recovered data.
- Sharing photos and files could fail silently.
- Layout fixes: the lock screen in landscape, the save button hidden by the keyboard, and others.
- Calendar months now read "November 2026", and the countdown to a tournament is larger.
- Pricing wording now matches what the app actually offers.
- The help text now explains how the device's automatic backup treats your data.
```

## fr-FR

```
Envoyez le planning sur LINE sous forme de carte
- Fini le lien interminable dans la conversation. Il suffit d'un appui sur « Voir le planning ».
- L'écran de partage a été refait : LINE, Lien, Texte ou code QR.

Protégez un planning par un mot de passe
- Avec un mot de passe, le planning est chiffré. Sans lui, le lien est illisible.
- Si vous partagez sans en avoir défini un, nous vous arrêtons pour confirmation.
- Les liens font environ la moitié de leur longueur précédente.

Corriger une seule journée
- Une journée a changé ? Envoyez cette journée seule, sans renvoyer tout le mois.

Corrections
- L'année scolaire était calculée un an trop tôt. Les années enregistrées sont corrigées, mais uniquement celles calculées automatiquement : vos saisies manuelles restent intactes.
- À l'import des résultats, une correspondance sur le seul nom de famille pouvait rattacher un résultat à la mauvaise personne. Une confirmation est désormais toujours demandée.
- Modifier l'effectif d'une rencontre par équipes pouvait décaler l'ordre ou effacer des résultats.
- Un rapport de combat pouvait enregistrer une victoire alors que rien n'était saisi.
- Le verrouillage par code pouvait, rarement, ne pas s'activer. Il s'active aussi au retour dans l'app.
- Si les données enregistrées ne pouvaient pas être lues, vous pouviez saisir dans une app vide et tout perdre. Un bandeau reste affiché et vous pouvez exporter les données récupérées.
- Le partage de photos et de fichiers pouvait échouer sans message.
- Corrections d'affichage : écran de verrouillage en paysage, bouton d'enregistrement masqué par le clavier, et d'autres.
- Les mois du calendrier s'affichent « novembre 2026 », et le compte à rebours avant une compétition est plus grand.
- Les mentions tarifaires correspondent maintenant à ce que l'app propose réellement.
- L'aide explique désormais comment la sauvegarde automatique de l'appareil traite vos données.
```

## pt-BR

```
Envie a agenda pelo LINE como um cartão
- Sem link interminável na conversa. Quem recebe só toca em "Ver agenda" no cartão.
- A tela de envio foi refeita: escolha LINE, Link, Texto ou código QR.

Proteja a agenda com uma senha
- Com uma senha, a agenda é criptografada. Quem não a tiver não consegue ler o link.
- Se tentar enviar sem definir uma, paramos e perguntamos antes.
- Os links agora têm cerca de metade do comprimento anterior.

Corrija um único dia
- Mudou um dia? Envie só aquele dia, sem reenviar o mês inteiro.

Correções
- O ano escolar era calculado um ano antes. Os anos já salvos também são corrigidos, mas só os definidos automaticamente — o que você editou à mão permanece.
- Ao importar resultados, uma correspondência apenas pelo sobrenome podia vincular o resultado à pessoa errada. Agora sempre pedimos confirmação.
- Alterar o número de atletas em uma competição por equipes podia desalinhar a ordem ou apagar resultados.
- Um relatório de luta podia registrar uma vitória sem nada preenchido.
- O bloqueio por senha podia, raramente, não ser aplicado. Agora também bloqueia ao voltar para o app.
- Se os dados salvos não pudessem ser lidos, você podia digitar em um app vazio e perder tudo. Um aviso permanece na tela e você pode exportar os dados recuperados.
- O compartilhamento de fotos e arquivos podia falhar sem aviso.
- Ajustes de layout: tela de bloqueio na horizontal, botão de salvar escondido pelo teclado, entre outros.
- Os meses do calendário aparecem como "novembro de 2026", e a contagem regressiva para a competição ficou maior.
- Os textos sobre preços agora correspondem ao que o app realmente oferece.
- A ajuda explica como o backup automático do aparelho trata os seus dados.
```

---

# 選手用 1.4（My柔道(選手)）

## ja（日本語）

```
■ 予定表の受け取りが楽になりました
・LINEで届いたカードの「予定を見る」を押すだけで取り込めます。
・リンクからそのまま取り込めるようになりました。
・道場が1日だけ直して送った予定も、そのまま受け取れます。

■ 予定表の合言葉
・道場から教わった合言葉を「設定 › セキュリティ › 予定表の合言葉」に登録しておくと、暗号化された予定表をそのまま開けます。一度登録すれば、次からは入力不要です。

■ 直したところ
・学年の自動計算が1年ずれていたのを直しました。保存済みの学年も直しますが、自動で付けたものだけです（手で直した学年はそのままです）。
・試合報告で、何も入力していないのに「勝ち」が記録されることがありました。
・パスコードロックが、まれにかからないことがありました。戻ってきたときにもかかるようにしました。
・データが読めなかったとき、空のまま入力して消えてしまうおそれがありました。帯でお知らせし、退避データを書き出せるようにしました。
・写真やファイルの共有が、黙って失敗することがありました。
・横向きのロック画面、キーボードで隠れる保存ボタンなど、画面の崩れを直しました。
・カレンダーの月を「2026年 11月」の形にしました。大会までの日数も大きく出します。
・無料でお使いいただける範囲の説明を、実際の内容に合わせて書き直しました。
・端末のおまかせバックアップの扱いについて、ヘルプに明記しました。
```

## en-US

```
Receiving a schedule is easier
- When a card arrives on LINE, just tap "See schedule" to import it.
- Links now import directly.
- If your dojo changed a single day, that update comes through on its own.

Schedule passphrase
- Save the passphrase your dojo gave you under Settings › Security › Schedule passphrase, and encrypted schedules open straight away. Enter it once and you are done.

Fixes
- School year was calculated one year early. Saved years are corrected too, but only those set automatically — years you edited by hand are left alone.
- A match report could record a win with nothing entered.
- The passcode lock could occasionally fail to engage. It now also locks when you return to the app.
- If saved data could not be read, you could type into an empty app and lose it. A banner now stays up and you can export the recovered data.
- Sharing photos and files could fail silently.
- Layout fixes: the lock screen in landscape, the save button hidden by the keyboard, and others.
- Calendar months now read "November 2026", and the countdown to a tournament is larger.
- The description of what you get for free now matches what the app actually offers.
- The help text now explains how the device's automatic backup treats your data.
```

## fr-FR

```
Recevoir un planning est plus simple
- Quand une carte arrive sur LINE, un appui sur « Voir le planning » suffit pour l'importer.
- Les liens s'importent désormais directement.
- Si votre dojo n'a modifié qu'une journée, cette mise à jour arrive seule.

Mot de passe du planning
- Enregistrez le mot de passe donné par votre dojo dans Réglages › Sécurité › Mot de passe du planning : les plannings chiffrés s'ouvrent aussitôt. Une seule saisie suffit.

Corrections
- L'année scolaire était calculée un an trop tôt. Les années enregistrées sont corrigées, mais uniquement celles calculées automatiquement : vos saisies manuelles restent intactes.
- Un rapport de combat pouvait enregistrer une victoire alors que rien n'était saisi.
- Le verrouillage par code pouvait, rarement, ne pas s'activer. Il s'active aussi au retour dans l'app.
- Si les données enregistrées ne pouvaient pas être lues, vous pouviez saisir dans une app vide et tout perdre. Un bandeau reste affiché et vous pouvez exporter les données récupérées.
- Le partage de photos et de fichiers pouvait échouer sans message.
- Corrections d'affichage : écran de verrouillage en paysage, bouton d'enregistrement masqué par le clavier, et d'autres.
- Les mois du calendrier s'affichent « novembre 2026 », et le compte à rebours avant une compétition est plus grand.
- La description de ce qui est gratuit correspond maintenant à ce que l'app propose réellement.
- L'aide explique désormais comment la sauvegarde automatique de l'appareil traite vos données.
```

## pt-BR

```
Receber a agenda ficou mais fácil
- Quando um cartão chega pelo LINE, basta tocar em "Ver agenda" para importar.
- Links agora importam direto.
- Se o seu dojo alterou apenas um dia, essa atualização chega sozinha.

Senha da agenda
- Salve a senha que o seu dojo informou em Configurações › Segurança › Senha da agenda, e as agendas criptografadas abrem na hora. Basta digitar uma vez.

Correções
- O ano escolar era calculado um ano antes. Os anos já salvos também são corrigidos, mas só os definidos automaticamente — o que você editou à mão permanece.
- Um relatório de luta podia registrar uma vitória sem nada preenchido.
- O bloqueio por senha podia, raramente, não ser aplicado. Agora também bloqueia ao voltar para o app.
- Se os dados salvos não pudessem ser lidos, você podia digitar em um app vazio e perder tudo. Um aviso permanece na tela e você pode exportar os dados recuperados.
- O compartilhamento de fotos e arquivos podia falhar sem aviso.
- Ajustes de layout: tela de bloqueio na horizontal, botão de salvar escondido pelo teclado, entre outros.
- Os meses do calendário aparecem como "novembro de 2026", e a contagem regressiva para a competição ficou maior.
- A descrição do que é gratuito agora corresponde ao que o app realmente oferece.
- A ajuda explica como o backup automático do aparelho trata os seus dados.
```

---

## App Store Connect で入力するときの手順

1. App Store Connect › 対象のアプリ › 左の「+ バージョンまたはプラットフォーム」で **1.3**（事務）／**1.4**（選手）を作る。
2. 「このバージョンの新機能」に、上の **ja** を貼る。言語を切り替えて en-US・fr-FR・pt-BR も貼る。
3. 「ビルド」で **1.3 (36)**（事務）／**1.4 (31)**（選手）を選ぶ。
4. 「App のプライバシー」を見直す（下記）。
5. 「審査へ提出」。

## 「App のプライバシー」で見直すところ

今回 LINE 連携が入ったので、申告を確認しておく必要がある。

- 本アプリの中に **LINE の SDK は入っていない**。「LINEでカードを送る」は、LINE アプリを URL で呼び出し、その先（LINE の中）で LINEヤフーの仕組みが動く形。
  したがって **アプリが集める／アプリから第三者へ渡すデータが増えたわけではない**、というのが素直な読み方。
- ただし、プライバシーポリシー（2026-11-20 改定）には「LINEヤフーが取得する情報と、広告の最適化を含む利用目的」を明記した。
  **申告とポリシーが食い違っていないか**を、提出前に社長と一緒に見ること。
- 既存の申告（RevenueCat まわり）は変更なしのはず。
