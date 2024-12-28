#!/bin/bash

# 域名和邮箱配置
domains=(jxa.us.kg)
email="dongpoding@gmail.com" # 改为你的邮箱
staging=0 # 设置为 1 可以在测试环境中使用

# 创建证书存储目录
mkdir -p data/certbot/conf/live/jxa.us.kg
mkdir -p data/certbot/www

# 停止现有容器
docker-compose down

# 删除任何现有的证书
rm -rf data/certbot/conf/*

# 创建临时自签名证书
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
  -keyout 'data/certbot/conf/live/jxa.us.kg/privkey.pem' \
  -out 'data/certbot/conf/live/jxa.us.kg/fullchain.pem' \
  -subj '/CN=localhost'

# 启动 nginx
docker-compose up --force-recreate -d nginx

# 获取真实证书
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    -d ${domains[0]} \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal \
    --no-eff-email" certbot

# 重启 nginx
docker-compose exec nginx nginx -s reload 