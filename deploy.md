# 部署指南

## 部署策略

### 1. 开发流程
```bash
# 1. 在 main 分支开发
git checkout main
git add .
git commit -m "更新功能"
git push origin main

# 2. 构建生产版本
npm run build:seo

# 3. 切换到部署分支
git checkout deploy
git checkout main -- dist/
git add dist/
git commit -m "部署版本 $(date)"
git push origin deploy
```

### 2. Vercel 配置
- 连接 `deploy` 分支到 Vercel
- 设置构建命令：`npm run build:seo`
- 设置输出目录：`dist`

### 3. 自动化脚本
使用 GitHub Actions 自动构建和部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:seo
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
```

## 安全措施

1. **源代码保护**：只有构建后的代码部署到生产环境
2. **版本控制**：完整源代码保留在 GitHub
3. **自动部署**：通过 CI/CD 自动化流程
4. **环境隔离**：开发和生产环境完全分离
