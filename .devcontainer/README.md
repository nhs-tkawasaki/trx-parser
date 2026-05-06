# Dev Container for trx-parser

GitHub Codespaces または VS Code Dev Containers で、Node.js と .NET SDK の両方が使える開発環境を提供します。

## 起動方法

### GitHub Codespaces

1. GitHub 上でリポジトリを開く
2. **Code** ボタン → **Codespaces** タブ → **Create codespace on \<branch-name\>** をクリック
3. コンテナのビルドと `postCreateCommand`（`npm ci && dotnet --info`）の実行が完了するまで待つ

### VS Code Dev Containers（ローカル）

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) と [Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) をインストール
2. このリポジトリをクローンして VS Code で開く
3. コマンドパレット（`F1`）から **Dev Containers: Reopen in Container** を実行

## 起動後の動作確認

Codespace / コンテナ起動後、ターミナルで以下を実行して各ツールが正しく入っているか確認してください。

```bash
# Node.js のバージョン確認 (v24.x が表示されること)
node -v

# npm のバージョン確認 (10.x 以上が表示されること)
npm -v

# .NET SDK のバージョン確認 (8.x または最新 LTS が表示されること)
dotnet --version

# 依存関係のインストールとビルド・テストの実行
npm ci && npm run all

# GitHub CLI のバージョン確認
gh --version

# act のバージョン確認
act --version

# actionlint のバージョン確認
actionlint --version
```

## dotnet test で .trx ファイルを生成する

このアクションは `.trx`（VSTest 形式）ファイルをパースします。テスト用の `.trx` ファイルは既に `test-data/` に収録されていますが、独自の `.trx` を生成したい場合は以下の手順で行えます。

```bash
# .NET プロジェクトがあるディレクトリで実行
cd /path/to/your-dotnet-project

# trx 形式でテスト結果を出力
dotnet test --logger "trx;LogFileName=results.trx"

# 生成されたファイルを確認
ls TestResults/results.trx
```

生成した `.trx` ファイルを `test-data/` ディレクトリに配置して `__tests__/` のテストに使用できます。

## act でローカルに GitHub Actions を実行する

`act` を使うと、GitHub Actions ワークフローをコンテナ内でローカル実行できます。

```bash
# 利用可能なワークフロー・ジョブを一覧表示
act --list

# push イベントをトリガーしてワークフローを実行（ドライラン）
act push --dryrun

# 実際に実行（Docker-in-Docker が必要な場合は注意）
act push
```

## actionlint でワークフローファイルを検証する

```bash
# .github/workflows/ 配下の全ファイルを検証
actionlint
```

## npm スクリプト一覧

| コマンド | 説明 |
|---|---|
| `npm run build` | TypeScript をコンパイル |
| `npm run format` | Prettier でフォーマット |
| `npm run lint` | ESLint で静的解析 |
| `npm run package` | `dist/` にバンドル |
| `npm test` | Jest でテスト実行 |
| `npm run all` | 上記すべてを順に実行 |
