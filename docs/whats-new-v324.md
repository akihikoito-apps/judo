# What's New の下書き（iOS 事務用 1.3・選手用 1.4／日・英・仏・葡）

作成日 2026-11-20。**下書きです。** App Store Connect への入力・提出はまだしていません。

> **2026-11-20 改訂（第2版）。** Codex に出荷前点検を依頼し、**9件の指摘**を受けて書き直した。
> こちらでコードを読んで裏を取ったうえで、**全件そのとおりだったので採った。**おもな直しは次のとおり。
>
> - **選手用から「パスコードロック」の項目を削除。**`lockRequired()`（index.html:15667）は
>   `APP_EDITION==='personal'` のとき必ず `false` を返す。**選手用ではロックがそもそも働かない。**
>   「横向きのロック画面」も同じ理由で選手用から削除。事務用の再ロックは「60秒以上離れたとき」なので、
>   「戻ったときに必ず」ではなく「一定時間離れて戻ったとき」と書き直した。
> - **「カードを押すだけで取り込める」をやめた。**実際はカード →表示ページ →「アプリで取り込む」→
>   アプリ内の確認、という流れ。1回押して保存完了ではない。
> - **月の表示例を削除。**アプリの実表示は `Nov 2026`／`nov. 2026`／`nov 2026`（index.html:5639）で、
>   `November 2026` とは出ない。仏の設定名は `Mot de passe de l'agenda`、葡の「設定」は `Ajustes`（index.html:5647）。
> - **カードのボタン名は実装上「予定を見る」固定**（share-liff.html:202）。英仏葡に存在しないボタン名を
>   書いていたので削除。
> - **データ読み取り失敗の説明を、今回入ったぶんだけに絞った。**外国語の "recovered data" は
>   「復旧できたデータ」と読めるが、書き出すのは**読み取れなかった元の文字列**なので言い換えた。
> - **「App のプライバシー」の節は、結論を削って確認手順に置き換えた**（下記）。

## もとにした変更

前回リリースのコミット `9cadfaa`（事務用 1.2・選手用 1.3 を出した版）から `HEAD` までの **107 コミット・31 版**（v276〜v325）。
CHANGELOG ファイルはないので、版ごとのコミット本文と `docs/app-audit-20261008.md`（10/8 の総点検）から書いた。

## 書き方の決まり（前回 docs/whats-new-draft.md と同じ）

- アプリ名の表記は `docs/store-text-check.md` に合わせる。
  事務用 en「My Judo: Dojo Manager」／fr「My Judo : Gestion Dojo」／pt「My Judo: Gestão de Dojo」。選手用は 3 言語とも「My Judo History」。
- 機能名・ボタン名・画面名は、**アプリの中の訳（`index.html` の辞書）に合わせる。**勝手に訳さない。
- 大げさな言い方はしない。直したこと・増えたことだけを書く。
- en はアメリカ式のつづり。fr の「タップ」は appui にそろえる。
- 上限 4000 文字。

## 入力前に確かめること

- **【未確認】合言葉つきの予定表を、選手用 1.3（現在ストアに出ている版）で開けるか。**
  暗号化は v299〜v300 ＝ 1.3 を出したあとに入れたもの。表示ページ側で復号するので
  「ページで中身を見て、文字をコピーしてアプリに貼る」経路は通るはずだが、**実機で確かめていない。**
- **【確認済み】リンクから直接取り込めるのは選手用 1.4 から。**`myjudo` の URL スキームは v296 で足したもので、
  選手用 1.3 には登録がない。旧版の方は、表示ページから文字をコピーして取り込む形になる。
  **ストア文面では「1.4 から」と断っていないので、断りを入れるか、文面から外すかを決めること。**
  いまの下書きは「リンクからそのまま取り込めるようになりました」としか書いていない（新機能の説明としては正しい）。
- **【確認済み】選手用の「日別シートに場所・メモ・出場者」は、すでに選手用 1.3 で出している**（v274・v275）。
  今回の新機能に入れないこと。

---

# 事務用 1.3（My柔道(事務)）

## ja（日本語）

```
■ 予定表をLINEのカードで送れるようになりました
・長いリンクがトーク画面に出ません。受け取った方は、カードのボタンから予定を開けます。
・送り方の画面を作り直しました。LINE／リンク／文字／QRコードの4つから選べます。

■ 予定表を合言葉で保護して送れます
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
・一定時間アプリを離れて戻ったときにも、パスコードロックがかかるようにしました。
・データを読み取れないときは、保存できないことを画面に表示し続けるようにしました。読み取れなかったデータを書き出して保管できます。
・写真やファイルの共有が、黙って失敗することがありました。
・横向きのロック画面、キーボードで隠れる保存ボタンなど、画面の崩れを直しました。
・カレンダーの月表示を見やすくしました。大会までの日数も大きく出します。
・ご利用料金の説明を、実際の内容に合わせて書き直しました。
・端末のおまかせバックアップの扱いについて、ヘルプに明記しました。
```

## en-US

```
Send your schedule to LINE as a card
- No more long link filling up the chat. Recipients open the schedule from the button on the card.
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
- The passcode lock now also engages when you come back after leaving the app for a while.
- When saved data cannot be read, a banner now stays up to say nothing is being saved, and you can export the unreadable data to keep it.
- Sharing photos and files could fail silently.
- Layout fixes: the lock screen in landscape, the save button hidden by the keyboard, and others.
- Calendar months are easier to read, and the countdown to a tournament is larger.
- Pricing wording now matches what the app actually offers.
- The help text now explains how the device's automatic backup treats your data.
```

## fr-FR

```
Envoyez le planning sur LINE sous forme de carte
- Fini le lien interminable dans la conversation. Les destinataires ouvrent le planning depuis le bouton de la carte.
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
- Le verrouillage par code s'active aussi au retour, après une absence prolongée de l'app.
- Lorsque les données enregistrées sont illisibles, un bandeau reste affiché pour signaler que rien n'est enregistré, et vous pouvez exporter les données illisibles afin de les conserver.
- Le partage de photos et de fichiers pouvait échouer sans message.
- Corrections d'affichage : écran de verrouillage en paysage, bouton d'enregistrement masqué par le clavier, et d'autres.
- Les mois du calendrier sont plus lisibles, et le compte à rebours avant une compétition est plus grand.
- Les mentions tarifaires correspondent maintenant à ce que l'app propose réellement.
- L'aide explique désormais comment la sauvegarde automatique de l'appareil traite vos données.
```

## pt-BR

```
Envie a agenda pelo LINE como um cartão
- Sem link interminável na conversa. Quem recebe abre a agenda pelo botão do cartão.
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
- O bloqueio por senha agora também é aplicado ao voltar, depois de um tempo fora do app.
- Quando os dados salvos não podem ser lidos, um aviso permanece na tela informando que nada está sendo salvo, e você pode exportar os dados ilegíveis para guardá-los.
- O compartilhamento de fotos e arquivos podia falhar sem aviso.
- Ajustes de layout: tela de bloqueio na horizontal, botão de salvar escondido pelo teclado, entre outros.
- Os meses do calendário ficaram mais fáceis de ler, e a contagem regressiva para a competição ficou maior.
- Os textos sobre preços agora correspondem ao que o app realmente oferece.
- A ajuda explica como o backup automático do aparelho trata os seus dados.
```

---

# 選手用 1.4（My柔道(選手)）

## ja（日本語）

```
■ 予定表の受け取りが楽になりました
・LINEで届いたカードのボタンから予定を開き、内容を確かめて取り込めます。
・リンクからそのまま取り込めるようになりました。
・道場が1日だけ直して送った予定も、そのまま受け取れます。

■ 予定表の合言葉
・道場から教わった合言葉を「設定 › セキュリティ › 予定表の合言葉」に登録しておくと、暗号化された予定表をそのまま開けます。一度登録すれば、次からは入力不要です。

■ 直したところ
・学年の自動計算が1年ずれていたのを直しました。保存済みの学年も直しますが、自動で付けたものだけです（手で直した学年はそのままです）。
・試合報告で、何も入力していないのに「勝ち」が記録されることがありました。
・データを読み取れないときは、保存できないことを画面に表示し続けるようにしました。読み取れなかったデータを書き出して保管できます。
・写真やファイルの共有が、黙って失敗することがありました。
・キーボードで保存ボタンが隠れるなど、画面の崩れを直しました。
・カレンダーの月表示を見やすくしました。大会までの日数も大きく出します。
・無料でお使いいただける範囲の説明を、実際の内容に合わせて書き直しました。
・端末のおまかせバックアップの扱いについて、ヘルプに明記しました。
```

## en-US

```
Receiving a schedule is easier
- When a card arrives on LINE, open the schedule from the button on it, check the contents and import.
- Links now import directly.
- If your dojo changed a single day, that update comes through on its own.

Schedule passphrase
- Save the passphrase your dojo gave you under Settings › Security › Schedule passphrase, and encrypted schedules open straight away. Enter it once and you are done.

Fixes
- School year was calculated one year early. Saved years are corrected too, but only those set automatically — years you edited by hand are left alone.
- A match report could record a win with nothing entered.
- When saved data cannot be read, a banner now stays up to say nothing is being saved, and you can export the unreadable data to keep it.
- Sharing photos and files could fail silently.
- Layout fixes, including the save button hidden by the keyboard.
- Calendar months are easier to read, and the countdown to a tournament is larger.
- The description of what you get for free now matches what the app actually offers.
- The help text now explains how the device's automatic backup treats your data.
```

## fr-FR

```
Recevoir un planning est plus simple
- Quand une carte arrive sur LINE, ouvrez le planning depuis son bouton, vérifiez le contenu et importez-le.
- Les liens s'importent désormais directement.
- Si votre dojo n'a modifié qu'une journée, cette mise à jour arrive seule.

Mot de passe de l'agenda
- Enregistrez le mot de passe donné par votre dojo dans Réglages › Sécurité › Mot de passe de l'agenda : les plannings chiffrés s'ouvrent aussitôt. Une seule saisie suffit.

Corrections
- L'année scolaire était calculée un an trop tôt. Les années enregistrées sont corrigées, mais uniquement celles calculées automatiquement : vos saisies manuelles restent intactes.
- Un rapport de combat pouvait enregistrer une victoire alors que rien n'était saisi.
- Lorsque les données enregistrées sont illisibles, un bandeau reste affiché pour signaler que rien n'est enregistré, et vous pouvez exporter les données illisibles afin de les conserver.
- Le partage de photos et de fichiers pouvait échouer sans message.
- Corrections d'affichage, dont le bouton d'enregistrement masqué par le clavier.
- Les mois du calendrier sont plus lisibles, et le compte à rebours avant une compétition est plus grand.
- La description de ce qui est gratuit correspond maintenant à ce que l'app propose réellement.
- L'aide explique désormais comment la sauvegarde automatique de l'appareil traite vos données.
```

## pt-BR

```
Receber a agenda ficou mais fácil
- Quando um cartão chega pelo LINE, abra a agenda pelo botão dele, confira o conteúdo e importe.
- Links agora importam direto.
- Se o seu dojo alterou apenas um dia, essa atualização chega sozinha.

Senha da agenda
- Salve a senha que o seu dojo informou em Ajustes › Segurança › Senha da agenda, e as agendas criptografadas abrem na hora. Basta digitar uma vez.

Correções
- O ano escolar era calculado um ano antes. Os anos já salvos também são corrigidos, mas só os definidos automaticamente — o que você editou à mão permanece.
- Um relatório de luta podia registrar uma vitória sem nada preenchido.
- Quando os dados salvos não podem ser lidos, um aviso permanece na tela informando que nada está sendo salvo, e você pode exportar os dados ilegíveis para guardá-los.
- O compartilhamento de fotos e arquivos podia falhar sem aviso.
- Ajustes de layout, incluindo o botão de salvar escondido pelo teclado.
- Os meses do calendário ficaram mais fáceis de ler, e a contagem regressiva para a competição ficou maior.
- A descrição do que é gratuito agora corresponde ao que o app realmente oferece.
- A ajuda explica como o backup automático do aparelho trata os seus dados.
```

---

## App Store Connect で入力するときの手順

1. App Store Connect › 対象のアプリ › 左の「+ バージョンまたはプラットフォーム」で **1.3**（事務）／**1.4**（選手）を作る。
2. 「このバージョンの新機能」に、上の **ja** を貼る。言語を切り替えて en-US・fr-FR・pt-BR も貼る。
3. 「ビルド」で、**いちばん新しいビルド**を選ぶ。
   - 2026-11-21 の時点で **事務 1.3 (38)／選手 1.4 (33)**（v326）。
   - **(36)／(31) は使わない**（アプリ内プライバシーポリシーが改定前）。
   - **(37)／(32) も使わない**（選手用のポリシーに、選手用には無い機能の説明が入っていた）。
4. 「App のプライバシー」を見直す（下記）。
5. 「審査へ提出」。

## 「App のプライバシー」の入力

### これは何の画面か

App Store Connect のアプリごとに1つある申告で、**バージョンとは別もの**です。
ここで答えた内容が、App Store の「アプリのプライバシー」の表になって誰にでも見えます。
保存しただけでは反映されず、**「公開」を押したときに切り替わります。**
（場所：App Store Connect › アプリ › 左の「App のプライバシー」）

### 答えの根拠（調べたこと）

- **RevenueCat（課金管理）**は、利用者が何もしなくても自動で通信します。
  RevenueCat 自身が「全員が申告すること」として挙げているのは
  **「購入 → 購入履歴」で、用途は『分析』と『App の機能』の2つ**です。
  （分析＝RevenueCat の管理画面の売上グラフ、App の機能＝レシート確認と加入判定）
  利用者IDは匿名のまま使っているので（`appUserID` を渡していない・`logIn` を呼んでいない）、
  **「ユーザーIDに紐づく」は「いいえ」**でよい。広告IDは集めていない（`collectDeviceIdentifiers` を呼んでいない）。
  参考：<https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy>
- **Apple の「申告しなくてよい例外」**には4つの条件が全部そろう必要があり、そのうち1つが
  **「そのデータが第三者の広告に使われないこと」**です。
  予定表をLINEで送る機能は、LINEヤフーの利用目的に**広告の最適化が含まれる**ため、ここで外れます。
  → **例外には当てはまらない。申告する側に寄せるのが安全。**
  参考：<https://developer.apple.com/app-store/app-privacy-details/>
- ただし Apple のいう**「トラッキング」**は「**自分のアプリで集めた利用者IDや端末IDを、
  外部のデータと結び付けて狙い撃ちの広告に使う／データブローカーに渡す**」ことです。
  本アプリは利用者IDも端末IDもLINEへ渡しておらず、LINEが送り主を分かるのは
  **利用者自身がLINEにログインしているから**です。
  → **「トラッキングに使う」は「いいえ」。ATT（追跡の許可を求める画面）は要らない。**

### 入力する内容（私の案）

**My柔道(事務)** — 3つ

| データ | 用途 | ユーザーIDに紐づくか | トラッキング |
|---|---|---|---|
| 購入 › 購入履歴 | 分析／App の機能 | いいえ | いいえ |
| 識別子 › デバイスID | App の機能 | いいえ | いいえ |
| ユーザーコンテンツ › その他のユーザーコンテンツ | App の機能／サードパーティ広告 | **はい** | いいえ |

**My柔道(選手)** — 2つ（上の表の1行目と2行目だけ。3行目は入れない）

| データ | 用途 | ユーザーIDに紐づくか | トラッキング |
|---|---|---|---|
| 購入 › 購入履歴 | 分析／App の機能 | いいえ | いいえ |
| 識別子 › デバイスID | App の機能 | いいえ | いいえ |

- **3行目が事務用だけなのは、選手用に予定表を送る画面が無いからです**（予定タブを出していない）。
  選手用アプリからLINEヤフーへ情報が渡る場面はありません。
- 3行目の「ユーザーコンテンツ」は、LINEのカードに載る**道場名・対象の月・件数・ひとこと・予定表のリンク**のことです。
- 3行目の「ユーザーIDに紐づく＝はい」は、**LINEが送り主を分かる**ためです（本アプリが渡すからではありません）。
- 「識別子 › デバイスID」は、RevenueCat の案内では広告IDを使う場合に必須とされているもので、
  本アプリは広告IDを使っていません。ただし**端末の識別子（IDFV）が渡ることを自分のポリシーに書いている**ので、
  書いたとおりに申告します。**申告を多めに出すこと自体は、Apple から罰せられません。**

### 判断の分かれ目（社長に決めていただきたいところ）

**3行目（ユーザーコンテンツ）を入れるか、入れないか。**

- **入れる**……自分のポリシーに「LINEヤフーが広告の最適化にも使う」と書いているので、**申告と説明が一致します。**
  食い違いはレビューで突かれやすいところなので、**私はこちらをおすすめします。**
- **入れない**……「利用者が共有ボタンでほかのアプリへ送ったのと同じで、本アプリが集めたデータではない」という
  立て方もできます。実際、ほかのアプリの「LINEで送る」ボタンは申告していないものが多いです。
  ただし今回は Apple の例外の条件を1つ満たしていないので、**説明を求められたときに弱い。**

どちらにしても、**審査の連絡事項（「App Review に関する情報」のメモ欄）に次の1段落を入れておく**と、
聞かれる前に説明が済みます。

```
予定表をLINEで送る機能について。送信は利用者が毎回選んだときにだけ行われます。
LINEヤフー株式会社のLIFF（shareTargetPicker）を使い、送る相手は利用者がLINEの画面で選びます。
本アプリは利用者IDや広告IDをLINEへ渡しておらず、外部のデータと結び付けた広告の利用（トラッキング）
は行っていません。LINEヤフーに渡る情報と利用目的（広告の最適化を含みます）は、
プライバシーポリシー（https://akihikoito-apps.github.io/judo/privacy.html）の第1章・第4章に記載しています。
```

### 入力の順番

1. 「App のプライバシー」を開き、**いま入っている回答をそのまま私に見せてください**（画面の写真1枚で足ります）。
   - 「データを収集していません」になっていたら、**それは直す必要があります**（RevenueCat の分が抜けている）。
   - 「購入」が入っていても、**用途に「分析」が入っていないことがあります。**そこを見ます。
2. 上の表と見比べて、足りないものを足す／余っているものを外す。
3. 「公開」を押す。**バージョンの提出とは別に、ここを押さないと表は変わりません。**
4. 提出画面の「App Review に関する情報」に、上のメモを貼る。

### 公開中のポリシーとの対応

ポリシーは 2026-11-21 改定版。
- 第4章に、外へ出ていく経路を**中黒の箇条書き**で列挙（RevenueCat／LINE／共有・書き出し／リンクを開いたとき／OSのバックアップ）。
- 「予定表をLINEで送る」機能と「パスコードロック」は**事務用アプリだけの機能**であることを明記。
- 選手用アプリの中に出るポリシーからは、**LINEの章そのものを外しました**（`build.js` が版ごとに削ります）。
