#!/bin/sh
# Xcode Cloud: クローン直後に実行される。
# Capacitor の依存(node_modules)を入れ、www をネイティブ側へコピーし、CocoaPods を解決する。
set -e
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

echo "== install node =="
brew list node >/dev/null 2>&1 || brew install node
node -v; npm -v

APP_DIR="$CI_PRIMARY_REPOSITORY_PATH/native/office"
cd "$APP_DIR"

echo "== npm ci =="
npm ci --no-audit --no-fund

echo "== build number -> $CI_BUILD_NUMBER =="
if [ -n "$CI_BUILD_NUMBER" ]; then
  sed -i '' "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $CI_BUILD_NUMBER;/g" ios/App/App.xcodeproj/project.pbxproj
fi

echo "== cap sync ios (copy www + pod install) =="
npx cap sync ios

echo "== done =="
