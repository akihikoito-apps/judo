#!/bin/sh
# Xcode Cloud: クローン直後に実行される。
# Capacitor の依存(node_modules)を入れ、www をネイティブ側へコピーし、CocoaPods を解決する。
set -e
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

echo "== install node & cocoapods =="
brew list node >/dev/null 2>&1 || brew install node
# Xcode Cloud のイメージには CocoaPods が入っていない。
# 入れずに cap sync すると pod install が「スキップ」されて exit 0 のまま進み、後段の Pods 参照でビルドが落ちる。
brew list cocoapods >/dev/null 2>&1 || brew install cocoapods
node -v; npm -v; pod --version

APP_DIR="$CI_PRIMARY_REPOSITORY_PATH/native/player"
cd "$APP_DIR"

echo "== npm ci =="
npm ci --no-audit --no-fund

echo "== build number -> $CI_BUILD_NUMBER =="
if [ -n "$CI_BUILD_NUMBER" ]; then
  sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER;/g" ios/App/App.xcodeproj/project.pbxproj
fi

echo "== regenerate www from the built single-file HTML =="
node ../build-www.js player

echo "== cap sync ios (copy www + pod install) =="
npx cap sync ios

# pod install が実際に走ったかを検証（走っていなければここで失敗させる）
if [ ! -f ios/App/Podfile.lock ]; then echo "ERROR: Podfile.lock がありません（pod install が実行されていません）"; exit 1; fi
if [ ! -d ios/App/Pods ]; then echo "ERROR: Pods ディレクトリがありません"; exit 1; fi

echo "== done =="
