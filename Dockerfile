# 使用官方的 Node.js 18 LTS 版本的 Alpine Linux 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm ci

# 复制项目文件到工作目录
COPY . .

# 暴露应用程序端口
EXPOSE 3000

# 启动应用程序
CMD ["node", "app.js"]
