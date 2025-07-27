# Markdown 渲染测试示例

## 标题测试

### 三级标题
#### 四级标题

## 文本格式

这是**粗体文本**和*斜体文本*，还有`行内代码`。

这是一个包含[链接](https://github.com)的段落。

## 列表测试

### 无序列表
- 项目一
- 项目二
  - 子项目 2.1
  - 子项目 2.2
- 项目三

### 有序列表
1. 第一步
2. 第二步
3. 第三步

## 代码块测试

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet("World");
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

## 表格测试

| 功能 | 简单模式 | 高级模式 |
|------|----------|----------|
| 模型数量 | 无限制 | 最多3个 |
| 系统提示词 | 单个 | 多个主题 |
| 对比方式 | 并排 | 矩阵 |

## 引用块测试

> 这是一个引用块示例。
> 
> 可以包含多行内容，用于展示重要信息或引用文字。

## Mermaid 流程图测试

```mermaid
graph TD
    A[开始] --> B{条件判断}
    B -->|是| C[执行操作A]
    B -->|否| D[执行操作B]
    C --> E[结束]
    D --> E
```

## Mermaid 时序图测试

```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant AI模型

    用户->>前端: 发送消息
    前端->>后端: 转发请求
    后端->>AI模型: 调用API
    AI模型->>后端: 返回响应
    后端->>前端: 返回结果
    前端->>用户: 显示回复
```

## Mermaid 甘特图测试

```mermaid
gantt
    title 项目开发进度
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析           :done,    des1, 2024-01-01,2024-01-05
    UI设计            :done,    des2, 2024-01-06, 2024-01-10
    section 开发阶段
    前端开发          :active,  dev1, 2024-01-11, 2024-01-25
    后端开发          :         dev2, 2024-01-16, 2024-01-30
    section 测试阶段
    功能测试          :         test1, 2024-01-26, 2024-02-05
    上线部署          :         deploy, 2024-02-06, 2024-02-10
```

## 水平分隔线

---

## 混合内容测试

这个示例展示了**markdown**和`mermaid`的混合使用效果：

1. 首先是文本描述
2. 然后是流程图：

```mermaid
flowchart LR
    A[输入] --> B[处理]
    B --> C[输出]
```

3. 最后是总结

这样就完成了一个完整的文档示例！

## 复杂 Mermaid 示例

```mermaid
graph TB
    subgraph "用户端"
        U1[Web界面]
        U2[移动端]
    end
    
    subgraph "前端服务"
        F1[React应用]
        F2[状态管理]
    end
    
    subgraph "后端服务"
        B1[API网关]
        B2[业务逻辑]
        B3[数据处理]
    end
    
    subgraph "AI服务"
        A1[DeepSeek]
        A2[Claude]
        A3[Kimi]
    end
    
    subgraph "数据存储"
        D1[会话数据]
        D2[用户配置]
    end
    
    U1 --> F1
    U2 --> F1
    F1 --> F2
    F2 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> A1
    B3 --> A2
    B3 --> A3
    B2 --> D1
    B2 --> D2
``` 