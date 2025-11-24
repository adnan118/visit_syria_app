module.exports = {
  apps: [
    {
      name: "visit_syria_app",
      script: "server.js",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        HOST:  "0.0.0.0",
        PORT: 7003,
        API_URL: "/api/v1",
        API: "/api/v1",
        ACCESS_TOKEN_SECRET: "vistsyriav11234",
        REFRESH_TOKEN_SECRET: "vist3syria2v1",
        // MySQL Database Configuration
        DB_HOST:  "0.0.0.0",
        DB_USER: "root",
        DB_PASSWORD: "",
        DB_NAME: "vs_app_db",
        DB_PORT: 3306,

        EMAIL: "vistsyria@gmail.com",
        EMAIL_PASSWORD: "ruqvxelvigdqqwkq",
        OAUTH_DEV_BYPASS: false,
        FRONTEND_URL: "https://visitsyria.fun",
        MEDIA_BASE_URL: "https://visitsyria.fun",
        
        // Firebase Configuration
        FIREBASE_PROJECT_ID: "visit-syria-c5bcf",
        FIREBASE_PRIVATE_KEY_ID: "4477eb8419b3212aac9499039290e2a91e368554",
        FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMR5dVV9/myQLc\nSNY9sS+qsq5yTQmf+ASYCHDJJljUbNvY1Z6Wr59Y3lTXR6teamt3k1w4ppwlgBPb\nJj/mcWAFQ9qvgl+OrtjLp+7nd/RI/dx/eIkXycOAQSHxV9ulfWT1I9D2jfS50Shy\nEqYTmpmY9JKEPAhHjlMQdFUfH0F4ZTbCyq/6fagDzmlpBbTWGknaEXDCCFDiOBqX\nDexXCGe5eUZcawFANu9SjX2CJZHe9ZAjBCC6dEyZ6Gs9Y3X31zfWd+77J2fdsTl2\nZ+DntYx0xtoCiTAmfVxzKq0DNRI0tEdW8hGCRSMw/JYk7wdjmpB0JUF9RZWfKRxe\nCFFgY/29AgMBAAECggEAWG/8A84V2G+Ype6AldfCN6fAnypb6t3wezNYRLUtytVP\n/llJHZptpYcnesYD2k2/Ndbdm4cB3bhLoFo4Wtclh1H/eHE8VmS65bxP0PTdFMaW\nsbbovxwx37IS9E2hgU0+qmQ1oLAHTXTQCkapkJ4jNhVX4xisSvJCYsLCYUViTjDZ\nVLMuco1nW0h59vPZJMRM8Mie2vXP3vpX0Xj3/xZ/RiehwZQO/nN+fLlB19pGaBuc\nrmLQHe0i0tVsOrw0RLDvJzvjYg8KJnz2msVZZ1cDOUiLhFvTHQwa0iVG+Ui0skcN\nLjmB8PR2zeXZ/w8mogIX1MSMZcitIuKXbFvhT9QhnwKBgQDnsv/CbsCZWoL3KJMZ\nt2PQ8mqCsmmvJ35K8POSoQox+gCUjDCcsalK6wIIQDwBCJI2tKqRXtltDu5XoESH\n+/SKlWT+M4GiKa/KVHZjKYhz5h5zcNe20G0HBlBm3GBPeOysWMRzeqxECZnfeZPy\nX54OEdiIMLnJ9X4Nhu6bCEIC9wKBgQDhtGQyfwNeUU5AClbp/e7xuo4ydlj0XL8n\ni9uC4tPUvNnnGtNxFubZ9RxRnu/EQUt467Q2ViX9RNJ74UsYp18SQQ9hRuIxFDgs\nu0XnEa7hLnjceJ/xYIBRLqX+plgxGKdk8+UeEFh7hUVq2xy8t4CcAENpKOoOxPps\np8zReVij6wKBgQDD7K8tQO4IP2tjiKHrKxJyy6qZXjjT7fdzc5DkOt0eKaN3+ZvZ\nxLm9KkCLrZWP4imRrPBXAPemquuMmW+Z9cpxraa69d72u311ADsj2ykRqFOzloYy\nhsjLGeG/OTcPvNeVXXKxm9gzqFK/kFU0rPpAN4L8lwdj6f1vftwhqLf5PQKBgQCb\nnuiTFJY6+u5sI3Tn42lUDKAs1QLigexfFQRmS4VpIklQGmP9jp/fWiyLbn29IJQs\nLMBV0rJg3YoPVjiUKBraGDfFh70/v8Q3u2woNT4SDxvQT+9f23y9/N8BJKqcN3Z7\nmdq5DuYjTLGfSrKWwCOR7HCOWmJ/intsXYpQSE3AvwKBgHTd/IhrKMUumFoH1f5u\n7vSyCFHhelZvDti74zDU0UL6h959LDtPmmbdlKsiArq+wrho4C/QYOYy0f4UDYvq\n70IdhSOYOiUExCclD/fsEWol611dkOFJIiVU1dtXLRP+ikBaRx3kzvJImfVKsxRd\nxbtEOyTIpca2ELuZO8+Z79y0\n-----END PRIVATE KEY-----\n",
        FIREBASE_CLIENT_EMAIL: "firebase-adminsdk-fbsvc@visit-syria-c5bcf.iam.gserviceaccount.com",
        FIREBASE_CLIENT_ID: "102670981477029408640",
      },
      watch: false,
      restart_delay: 1000,
      max_restarts: 10,
      // Additional settings for performance optimization
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      error_file: "/root/.pm2/logs/visit_syria_app-error.log",
      out_file: "/root/.pm2/logs/visit_syria_app-out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      time: true,
      env: {
        NODE_ENV: process.env.NODE_ENV || "production",
        HOST: process.env.HOST || "0.0.0.0",
        PORT: process.env.PORT || 7003,
        API_URL: process.env.API_URL || "/api/v1",
        API: process.env.API || "/api/v1",
        ACCESS_TOKEN_SECRET:
          process.env.ACCESS_TOKEN_SECRET || "vistsyriav11234",
        REFRESH_TOKEN_SECRET:
          process.env.REFRESH_TOKEN_SECRET || "vist3syria2v1",
        MONGODB_CONNECTION_STRING:
          process.env.MONGODB_CONNECTION_STRING ||
          "mongodb+srv://vistsyria_db_user:tKqNReruWeiX55sX@cluster0.smtwgvh.mongodb.net/vistsyria_db?retryWrites=true&w=majority&appName=Cluster0",
        EMAIL: process.env.EMAIL || "vistsyria@gmail.com",
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "ruqvxelvigdqqwkq",
        OAUTH_DEV_BYPASS: process.env.OAUTH_DEV_BYPASS || false,
        FRONTEND_URL:
          process.env.FRONTEND_URL || "https://visitsyria.fun",
        MEDIA_BASE_URL:
          process.env.MEDIA_BASE_URL || "https://visitsyria.fun",

        FIREBASE_PROJECT_ID:
          process.env.FIREBASE_PROJECT_ID || "visit-syria-c5bcf",
        FIREBASE_API_KEY:
          process.env.FIREBASE_API_KEY ||
          "AIzaSyD1uDbFCUJbf7Vqjbdnrds1nuXIqNfZ-7Y",
        FIREBASE_AUTH_DOMAIN:
          process.env.FIREBASE_AUTH_DOMAIN ||
          "visit-syria-c5bcf.firebaseapp.com",
        FIREBASE_PRIVATE_KEY_ID:
          process.env.FIREBASE_PRIVATE_KEY_ID ||
          "4477eb8419b3212aac9499039290e2a91e368554",
        FIREBASE_PRIVATE_KEY:
          process.env.FIREBASE_PRIVATE_KEY ||
          "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMR5dVV9/myQLc\nSNY9sS+qsq5yTQmf+ASYCHDJJljUbNvY1Z6Wr59Y3lTXR6teamt3k1w4ppwlgBPb\nJj/mcWAFQ9qvgl+OrtjLp+7nd/RI/dx/eIkXycOAQSHxV9ulfWT1I9D2jfS50Shy\nEqYTmpmY9JKEPAhHjlMQdFUfH0F4ZTbCyq/6fagDzmlpBbTWGknaEXDCCFDiOBqX\nDexXCGe5eUZcawFANu9SjX2CJZHe9ZAjBCC6dEyZ6Gs9Y3X31zfWd+77J2fdsTl2\nZ+DntYx0xtoCiTAmfVxzKq0DNRI0tEdW8hGCRSMw/JYk7wdjmpB0JUF9RZWfKRxe\nCFFgY/29AgMBAAECggEAWG/8A84V2G+Ype6AldfCN6fAnypb6t3wezNYRLUtytVP\n/llJHZptpYcnesYD2k2/Ndbdm4cB3bhLoFo4Wtclh1H/eHE8VmS65bxP0PTdFMaW\nsbbovxwx37IS9E2hgU0+qmQ1oLAHTXTQCkapkJ4jNhVX4xisSvJCYsLCYUViTjDZ\nVLMuco1nW0h59vPZJMRM8Mie2vXP3vpX0Xj3/xZ/RiehwZQO/nN+fLlB19pGaBuc\nrmLQHe0i0tVsOrw0RLDvJzvjYg8KJnz2msVZZ1cDOUiLhFvTHQwa0iVG+Ui0skcN\nLjmB8PR2zeXZ/w8mogIX1MSMZcitIuKXbFvhT9QhnwKBgQDnsv/CbsCZWoL3KJMZ\nt2PQ8mqCsmmvJ35K8POSoQox+gCUjDCcsalK6wIIQDwBCJI2tKqRXtltDu5XoESH\n+/SKlWT+M4GiKa/KVHZjKYhz5h5zcNe20G0HBlBm3GBPeOysWMRzeqxECZnfeZPy\nX54OEdiIMLnJ9X4Nhu6bCEIC9wKBgQDhtGQyfwNeUU5AClbp/e7xuo4ydlj0XL8n\ni9uC4tPUvNnnGtNxFubZ9RxRnu/EQUt467Q2ViX9RNJ74UsYp18SQQ9hRuIxFDgs\nu0XnEa7hLnjceJ/xYIBRLqX+plgxGKdk8+UeEFh7hUVq2xy8t4CcAENpKOoOxPps\np8zReVij6wKBgQDD7K8tQO4IP2tjiKHrKxJyy6qZXjjT7fdzc5DkOt0eKaN3+ZvZ\nxLm9KkCLrZWP4imRrPBXAPemquuMmW+Z9cpxraa69d72u311ADsj2ykRqFOzloYy\nhsjLGeG/OTcPvNeVXXKxm9gzqFK/kFU0rPpAN4L8lwdj6f1vftwhqLf5PQKBgQCb\nnuiTFJY6+u5sI3Tn42lUDKAs1QLigexfFQRmS4VpIklQGmP9jp/fWiyLbn29IJQs\nLMBV0rJg3YoPVjiUKBraGDfFh70/v8Q3u2woNT4SDxvQT+9f23y9/N8BJKqcN3Z7\nmdq5DuYjTLGfSrKWwCOR7HCOWmJ/intsXYpQSE3AvwKBgHTd/IhrKMUumFoH1f5u\n7vSyCFHhelZvDti74zDU0UL6h959LDtPmmbdlKsiArq+wrho4C/QYOYy0f4UDYvq\n70IdhSOYOiUExCclD/fsEWol611dkOFJIiVU1dtXLRP+ikBaRx3kzvJImfVKsxRd\nxbtEOyTIpca2ELuZO8+Z79y0\n-----END PRIVATE KEY-----\n",
        FIREBASE_CLIENT_EMAIL:
          process.env.FIREBASE_CLIENT_EMAIL ||
          "firebase-adminsdk-fbsvc@visit-syria-c5bcf.iam.gserviceaccount.com",
        FIREBASE_CLIENT_ID:
          process.env.FIREBASE_CLIENT_ID || "102670981477029408640",
      },
      // Production optimizations
      node_args: "--max-old-space-size=2048", // Increase memory limit
      kill_timeout: 5000, // Time to wait before killing process
      listen_timeout: 8000, // Time to wait for app to start
    },
  ],
};

// PM2 Commands:
// pm2 start ecosystem.config.js  - Start the application
// pm2 restart visit_syria_app - Restart the application
// pm2 stop visit_syria_app    - Stop the application
// pm2 logs visit_syria_app    - View logs
// pm2 monit                  - Monitor resources
// pm2 save                   - Save current process list
// pm2 startup                - Setup startup script
