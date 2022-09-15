# Cesium-ana
基于cesium的分析工具


## 已实现功能：
1. 等高线: 

# 使用
## 安装

```bash
npm install cesium-ana
```

## 引入
```javascript
import CesiumAna from 'cesium-ana'
```

## 初始化
```javascript
let ana = new CesiumAna(viewer)
```
viewer是cesium的 Cesium.Viewer的实例


## 使用分析功能
### 等高线
```javascript
ana.createHeightLine()
```
