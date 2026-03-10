# project2 - 美团外卖柜网页演示

这是一个纯静态前端项目，使用 `HTML + CSS + JavaScript + Web Worker` 实现。

## 结构

- `index.html`: 页面结构
- `styles.css`: 界面样式与柜体动画视觉
- `app.js`: 页面交互与渲染
- `worker.js`: 使用 Web Worker 模拟后台线程串行处理命令

## 本地运行

直接双击 `index.html` 一般即可打开。  
如果浏览器对 Worker 的本地文件访问有限制，建议用一个静态服务器启动：

```powershell
cd d:\Cursor\Project\beginner\project2
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 部署到 GitHub Pages

1. 在 GitHub 新建一个 `Public` 仓库
2. 把当前 `project2` 目录内容上传到仓库根目录
3. 进入 GitHub 仓库 `Settings -> Pages`
4. `Source` 选择 `Deploy from a branch`
5. 分支选择 `main`，目录选择 `/ (root)`
6. 保存后等待 GitHub Pages 构建完成

最终访问地址通常是：

```text
https://<你的用户名>.github.io/<仓库名>/
```

## 部署到 Vercel

这是纯静态站点，直接导入仓库即可，无需额外配置。
