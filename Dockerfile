# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的构建工具
RUN apk add --no-cache python3 make g++

# 安装 pnpm 和 typescript
RUN npm install -g pnpm typescript

# 复制 package.json 和 workspace 配置
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# 安装所有依赖（包括 devDependencies）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 先安装 shared 包的依赖
RUN cd packages/shared && pnpm install

# 构建 shared 包
RUN cd packages/shared && pnpm exec tsc

# 构建 web 应用
RUN cd apps/web && pnpm build

# 生产环境镜像
FROM node:18-alpine AS runner

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 workspace 配置
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# 从构建阶段复制构建产物
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

# 仅安装生产依赖
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod

# 设置环境变量
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 设置工作目录到 web 应用
WORKDIR /app/apps/web

# 启动应用
CMD ["pnpm", "start"] 